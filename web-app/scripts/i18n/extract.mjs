import fs from "fs";
import { globSync } from "glob";
import path from "path";
import {
  targetGlob,
  ignoreFiles,
  enResourceFile,
  extractionLogFile,
} from "./config.mjs";
import { extractI18nKeys } from "./transformCode.mjs";

const run = () => {
  console.log("[i18n] extracting keys...");
  const files = globSync(targetGlob, { nodir: true });
  const filtered = files.filter((file) => !ignoreFiles.includes(file));
  const collected = [];

  filtered.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    collected.push(...extractI18nKeys(source, filePath));
  });

  fs.mkdirSync(path.dirname(extractionLogFile), { recursive: true });
  fs.writeFileSync(extractionLogFile, JSON.stringify(collected, null, 2));

  const entries = new Map();
  collected.forEach(({ key, value }) => {
    if (!entries.has(key)) {
      entries.set(key, value);
    }
  });

  const sorted = Array.from(entries.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const enObject = Object.fromEntries(sorted);
  fs.mkdirSync(path.dirname(enResourceFile), { recursive: true });
  fs.writeFileSync(enResourceFile, `${JSON.stringify(enObject, null, 2)}\n`);

  console.log(`[i18n] wrote ${sorted.length} keys to ${path.relative(process.cwd(), enResourceFile)}`);
};

run();
