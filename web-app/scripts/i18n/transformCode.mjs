import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
import {
  attributeShouldTranslate,
  createAst,
  createTranslateCall,
  ensureI18nImport,
  extractTranslateCalls,
  normalizeText,
  shouldSkipLiteral,
  shouldTranslate,
} from "./utils.mjs";

const traverse = traverseModule.default ?? traverseModule;
const generate = generateModule.default ?? generateModule;

const recordTemplate = (logs, filePath, node) => {
  logs.push({
    file: filePath,
    loc: node.loc ? node.loc.start : null,
    value: node.quasis.map((item) => item.value.cooked).join("${}"),
  });
};

const wrapJsxExpression = (expression) => t.jsxExpressionContainer(expression);

export const transformFile = (code, filePath) => {
  const ast = createAst(code);
  let changed = false;
  const templateNotes = [];

  traverse(ast, {
    JSXText(path) {
      const raw = path.node.value;
      if (!shouldTranslate(raw)) {
        return;
      }
      const text = normalizeText(raw);
      if (!text) {
        return;
      }
      path.replaceWith(wrapJsxExpression(createTranslateCall(text)));
      changed = true;
    },
    JSXAttribute(path) {
      if (!attributeShouldTranslate(path)) {
        return;
      }

      const { value } = path.node;
      if (t.isStringLiteral(value) && shouldTranslate(value.value)) {
        const normalized = normalizeText(value.value);
        if (!normalized) {
          return;
        }
        path.node.value = wrapJsxExpression(createTranslateCall(normalized));
        changed = true;
        return;
      }

      if (
        t.isJSXExpressionContainer(value) &&
        t.isStringLiteral(value.expression) &&
        shouldTranslate(value.expression.value)
      ) {
        const normalized = normalizeText(value.expression.value);
        if (!normalized) {
          return;
        }
        value.expression = createTranslateCall(normalized);
        changed = true;
      }
    },
    TemplateLiteral(path) {
      if (path.node.expressions.length > 0) {
        recordTemplate(templateNotes, filePath, path.node);
        return;
      }

      const [first] = path.node.quasis;
      const raw = first?.value?.cooked ?? "";
      if (!shouldTranslate(raw)) {
        return;
      }
      const normalized = normalizeText(raw);
      if (!normalized) {
        return;
      }

      const replacement = createTranslateCall(normalized);
      if (path.parentPath?.isJSXExpressionContainer()) {
        path.replaceWith(replacement);
      } else {
        path.replaceWith(createTranslateCall(normalized));
      }
      changed = true;
    },
    StringLiteral(path) {
      if (shouldSkipLiteral(path)) {
        return;
      }
      if (!shouldTranslate(path.node.value)) {
        return;
      }
      const normalized = normalizeText(path.node.value);
      if (!normalized) {
        return;
      }

      if (
        path.parentPath?.isJSXExpressionContainer() &&
        path.parentPath.parentPath?.isJSXElement()
      ) {
        path.replaceWith(createTranslateCall(normalized));
        changed = true;
      }
    },
  });

  if (changed) {
    ensureI18nImport(ast);
  }

  const output = generate(ast, { retainLines: true }, code);

  return {
    code: output.code,
    changed,
    templates: templateNotes,
  };
};

export const extractI18nKeys = (code, filePath) => {
  const ast = createAst(code);
  return extractTranslateCalls(ast, filePath);
};
