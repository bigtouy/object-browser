# Object Browser i18n Automation

This folder contains helper scripts that prepare the Object Browser UI for i18n. The implementation is inspired by [minio-console-i18n](https://github.com/lvyueyang/minio-console-i18n) but tailored for this repository layout.

## Scripts

- `index.mjs` – walks through `src/` and wraps eligible UI strings with `t("...")`.
- `extract.mjs` – scans for `t("...")` calls and updates `dist/i18n/en.json` plus `dist/i18n/log.json`.

Both scripts rely on simple heuristics (component attribute allow-lists, URL/path guards, etc.). You can extend those rules in `config.mjs` and `includeComponentAttributes.json` as needed.

## Usage

1. Install tooling dependencies and i18next:

   ```bash
   yarn install
   ```

2. Run the transformer:

   ```bash
   yarn i18n:transform
   ```

   Inspect the diff and review `dist/i18n/template-string-log.json` for template literals that still need manual handling.
3. Generate the English resource seed:

   ```bash
   yarn i18n:extract
   ```

   The resulting `dist/i18n/en.json` can be copied into `src/` after you wire up i18next in the application entry point.

## Adjusting The Rules

- Update `includeComponentAttributes.json` when new components or props should default to translation.
- Append attribute names to `includeCommonAttributes` in `config.mjs` for global coverage.
- If a file should never be touched, add it (or a glob) to `ignoreGlobs` inside `config.mjs`.

## Next Steps

After applying the automated changes you still need to:

1. Initialize `i18next` (or `react-i18next`) in `src/index.tsx`.
2. Replace the placeholder English resources with translated bundles (for example by duplicating `en.json` and translating values).
3. Audit the UI for strings that contain runtime values or rich formatting – these usually require manual attention even when the script logs them.
