import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getRuleBlock(selector: string) {
  const match = styles.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{(?<declarations>[^}]*)\\}`));

  expect(match, `${selector} rule block`).not.toBeNull();

  return match?.groups?.declarations ?? '';
}

function expectRuleDeclaration(selector: string, declaration: string) {
  expect(getRuleBlock(selector)).toContain(declaration);
}

describe('styles.css layout regressions', () => {
  it('pins the sidebar and workspace to their grid columns', () => {
    expectRuleDeclaration('.sidebar', 'grid-column: 1;');
    expectRuleDeclaration('.workspace', 'grid-column: 2;');
    expectRuleDeclaration('.app-shell.sidebar-collapsed .workspace', 'grid-column: 2;');
  });

  it('centers the dashboard after the available workspace width changes', () => {
    expect(styles).toContain('.dashboard {');
    expect(styles).toContain('margin-inline: auto;');
  });

  it('uses text-only branding instead of a square brand mark', () => {
    expect(styles).toContain('.brand-title');
    expect(styles).toContain('.brand-subtitle');
    expect(styles).not.toContain('.brand-mark {');
  });
});
