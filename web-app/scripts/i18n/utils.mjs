import * as t from "@babel/types";
import { parse } from "@babel/parser";
import {
  includeCommonAttributes,
  includeComponentAttributes,
} from "./config.mjs";

const urlLike = /^(https?:)?\/\//i;
const pathLike = /\/[A-Za-z0-9\-_.~]+/;
const onlySymbols = /^[-\s\d.,:;!?+]+$/;

export const createAst = (code) =>
  parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

export const normalizeText = (value) =>
  value
    .replace(/\s+/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();

export const shouldTranslate = (value) => {
  if (typeof value !== "string") return false;
  const raw = normalizeText(value);
  if (!raw) return false;
  if (!/[A-Za-z]/.test(raw)) return false;
  if (onlySymbols.test(raw)) return false;
  if (urlLike.test(raw)) return false;
  if (pathLike.test(raw) && !raw.includes(" ")) return false;
  return true;
};

export const createTranslateCall = (text) =>
  t.callExpression(t.identifier("t"), [t.stringLiteral(text)]);

export const isTranslateCall = (node) =>
  t.isCallExpression(node) && t.isIdentifier(node.callee, { name: "t" });

const hasTranslateParent = (path) =>
  path.findParent((parent) => isTranslateCall(parent.node));

export const ensureI18nImport = (ast) => {
  const alreadyImported = ast.program.body.some(
    (node) =>
      t.isImportDeclaration(node) && node.source.value === "i18next" &&
      node.specifiers.some((spec) =>
        t.isImportSpecifier(spec) &&
        t.isIdentifier(spec.imported, { name: "t" }),
      ),
  );

  if (alreadyImported) {
    return;
  }

  const specifier = t.importSpecifier(t.identifier("t"), t.identifier("t"));
  const importNode = t.importDeclaration([specifier], t.stringLiteral("i18next"));
  const body = ast.program.body;

  if (body.length === 0) {
    body.push(importNode);
    return;
  }

  const firstNode = body[0];
  if (firstNode.leadingComments?.length) {
    importNode.leadingComments = firstNode.leadingComments;
    delete firstNode.leadingComments;
  }

  body.unshift(importNode);
};

const getComponentName = (openingElement) => {
  if (!openingElement) return undefined;
  const { name } = openingElement;
  if (!name) return undefined;
  if (t.isJSXIdentifier(name)) return name.name;
  if (t.isJSXMemberExpression(name)) {
    const parts = [];
    let current = name;
    while (t.isJSXMemberExpression(current)) {
      if (t.isJSXIdentifier(current.property)) {
        parts.unshift(current.property.name);
      }
      current = current.object;
    }
    if (t.isJSXIdentifier(current)) {
      parts.unshift(current.name);
    }
    return parts.join(".");
  }
  return undefined;
};

export const attributeShouldTranslate = (path) => {
  if (!t.isJSXAttribute(path.node) || !t.isJSXIdentifier(path.node.name)) {
    return false;
  }

  const attrName = path.node.name.name;
  if (includeCommonAttributes.includes(attrName)) {
    return true;
  }

  const componentName = getComponentName(path.parent);
  if (componentName) {
    const attrs = includeComponentAttributes[componentName];
    if (Array.isArray(attrs) && attrs.includes(attrName)) {
      return true;
    }
  }

  return false;
};

export const extractTranslateCalls = (ast, filePath) => {
  const items = [];

  t.traverseFast(ast.program, (node) => {
    if (isTranslateCall(node)) {
      const [firstArg] = node.arguments;
      if (t.isStringLiteral(firstArg)) {
        items.push({
          key: firstArg.value,
          value: firstArg.value,
          file: filePath,
          loc: node.loc ? node.loc.start : null,
        });
      }
    }
  });

  return items;
};

export const shouldSkipLiteral = (path) => {
  if (hasTranslateParent(path)) return true;
  if (path.findParent((parent) => parent.isImportDeclaration())) return true;
  if (path.findParent((parent) => parent.isExportDeclaration())) return true;
  if (path.findParent((parent) => parent.isObjectProperty())) {
    const parentNode = path.parent;
    if (t.isObjectProperty(parentNode)) {
      if (!parentNode.computed && t.isIdentifier(parentNode.key)) {
        return /^[A-Z0-9_]+$/.test(parentNode.key.name);
      }
      if (t.isStringLiteral(parentNode.key)) {
        return /^[A-Z0-9_]+$/.test(parentNode.key.value);
      }
    }
  }
  return false;
};
