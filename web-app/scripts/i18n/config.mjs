import { globSync } from "glob";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, "..", "..");
export const srcDir = path.join(projectRoot, "src");

const defaultPattern = "**/*.{ts,tsx}";
export const targetGlob = path
  .join(srcDir, defaultPattern)
  .replace(/\\/g, "/");

export const ignoreGlobs = [
  "**/__tests__/**",
  "**/__mocks__/**",
  "**/*.d.ts",
  "**/lang/**",
  "**/i18n/**",
];

const ignoredFiles = new Set();
ignoreGlobs.forEach((pattern) => {
  globSync(path.join(srcDir, pattern).replace(/\\/g, "/"), {
    nodir: true,
  }).forEach((match) => ignoredFiles.add(match));
});
export const ignoreFiles = Array.from(ignoredFiles);

export const includeCommonAttributes = [
  "aria-label",
  "ariaLabel",
  "caption",
  "description",
  "emptyMessage",
  "emptyTitle",
  "helperText",
  "label",
  "placeholder",
  "subtitle",
  "title",
  "tooltip",
];

const includeComponentAttributesPath = path.join(
  __dirname,
  "includeComponentAttributes.json",
);
export const includeComponentAttributes = JSON.parse(
  fs.readFileSync(includeComponentAttributesPath, "utf8"),
);

export const distRoot = path.join(__dirname, "dist", "i18n");
export const enResourceFile = path.join(distRoot, "en.json");
export const extractionLogFile = path.join(distRoot, "log.json");
export const templateLogFile = path.join(
  distRoot,
  "template-string-log.json",
);
