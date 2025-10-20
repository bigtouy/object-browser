import fs from "fs";
import { globSync } from "glob";
import path from "path";
import {
  targetGlob,
  ignoreFiles,
  templateLogFile,
} from "./config.mjs";
import { transformFile } from "./transformCode.mjs";

const run = () => {
  console.log("[i18n] scanning files...");
  const files = globSync(targetGlob, { nodir: true });
  const filtered = files.filter((file) => !ignoreFiles.includes(file));

  if (filtered.length === 0) {
    console.log("[i18n] no target files found");
    return;
  }

  let edited = 0;
  const templateLog = [];

  filtered.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const { code, changed, templates } = transformFile(source, filePath);
    if (changed) {
      fs.writeFileSync(filePath, code);
      edited += 1;
      console.log(`[i18n] transformed ${path.relative(process.cwd(), filePath)}`);
    }
    if (templates.length > 0) {
      templateLog.push({ file: filePath, templates });
    }
  });

  fs.mkdirSync(path.dirname(templateLogFile), { recursive: true });
  fs.writeFileSync(templateLogFile, JSON.stringify(templateLog, null, 2));

  console.log(`[i18n] processed ${filtered.length} files`);
  console.log(`[i18n] modified ${edited} files`);
  console.log(`[i18n] template strings for review: ${templateLog.length}`);
};

run();
