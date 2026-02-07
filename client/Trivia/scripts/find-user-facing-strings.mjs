import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const ROOT = path.resolve(process.cwd(), 'src');

const USER_FACING_ATTRS = new Set(['title', 'placeholder', 'alt', 'aria-label']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const ent of entries) {
    if (ent.name === 'node_modules' || ent.name === 'dist') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function isIgnorableFile(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  return (
    normalized.endsWith('/src/constants/strings.js') ||
    normalized.endsWith('/src/constants/icons.js')
  );
}

function formatLoc(loc) {
  if (!loc) return '';
  return `${loc.start.line}:${loc.start.column + 1}`;
}

function extractTemplateText(node) {
  if (!node || node.type !== 'TemplateLiteral') return '';
  return node.quasis.map((q) => q.value.cooked || '').join('${…}');
}

function main() {
  const files = walk(ROOT).filter((p) => p.endsWith('.jsx') || p.endsWith('.js'));
  const issues = [];

  for (const filePath of files) {
    if (isIgnorableFile(filePath)) continue;

    const code = fs.readFileSync(filePath, 'utf8');
    let ast;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx'],
        sourceFilename: filePath,
        errorRecovery: true,
      });
    } catch {
      continue;
    }

    traverse.default(ast, {
      JSXText(p) {
        const text = String(p.node.value || '').replace(/\s+/g, ' ').trim();
        if (!text) return;
        issues.push({
          filePath,
          loc: p.node.loc,
          kind: 'JSXText',
          text,
        });
      },

      JSXAttribute(p) {
        const name = p.node.name?.name;
        if (!USER_FACING_ATTRS.has(name)) return;

        const value = p.node.value;
        if (!value) return;

        if (value.type === 'StringLiteral') {
          issues.push({
            filePath,
            loc: value.loc || p.node.loc,
            kind: `attr:${name}`,
            text: value.value,
          });
          return;
        }

        if (value.type === 'JSXExpressionContainer') {
          const expr = value.expression;
          if (expr?.type === 'StringLiteral') {
            issues.push({
              filePath,
              loc: expr.loc || value.loc || p.node.loc,
              kind: `attr:${name}`,
              text: expr.value,
            });
          } else if (expr?.type === 'TemplateLiteral') {
            const t = extractTemplateText(expr).trim();
            if (t) {
              issues.push({
                filePath,
                loc: expr.loc || value.loc || p.node.loc,
                kind: `attr:${name}`,
                text: t,
              });
            }
          }
        }
      },

      CallExpression(p) {
        const callee = p.node.callee;
        const args = p.node.arguments || [];
        if (args.length === 0) return;

        const first = args[0];
        const firstText =
          first?.type === 'StringLiteral'
            ? first.value
            : first?.type === 'TemplateLiteral'
              ? extractTemplateText(first).trim()
              : '';
        if (!firstText) return;

        const isConfirm =
          callee?.type === 'MemberExpression' &&
          callee.object?.type === 'Identifier' &&
          callee.object.name === 'window' &&
          callee.property?.type === 'Identifier' &&
          ['confirm', 'alert', 'prompt'].includes(callee.property.name);

        const isMessageSetter =
          callee?.type === 'Identifier' &&
          ['setError', 'setSuccess', 'setInfo', 'setMessage', 'toast'].includes(callee.name);

        if (!isConfirm && !isMessageSetter) return;

        issues.push({
          filePath,
          loc: first.loc || p.node.loc,
          kind: isConfirm ? 'window.' + callee.property.name : callee.name,
          text: firstText,
        });
      },
    });
  }

  if (issues.length === 0) {
    process.stdout.write('OK: no user-facing string literals found by scanner.\\n');
    process.exit(0);
  }

  const grouped = new Map();
  for (const it of issues) {
    const arr = grouped.get(it.filePath) || [];
    arr.push(it);
    grouped.set(it.filePath, arr);
  }

  for (const [filePath, items] of grouped) {
    const rel = path.relative(process.cwd(), filePath);
    process.stdout.write(`\\n${rel}\\n`);
    for (const it of items) {
      process.stdout.write(`  - ${formatLoc(it.loc)} ${it.kind}: ${JSON.stringify(it.text)}\\n`);
    }
  }

  process.stdout.write(`\\nFound ${issues.length} potential issues.\\n`);
  process.exit(1);
}

main();

