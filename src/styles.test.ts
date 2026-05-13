/// <reference types="node" />

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
    expectRuleDeclaration('.dashboard', 'margin-inline: auto;');
  });

  it('uses text-only branding instead of a square brand mark', () => {
    expect(styles).toContain('.brand-title');
    expect(styles).toContain('.brand-subtitle');
    expect(styles).not.toContain('.brand-mark {');
  });

  it('keeps real estate dashboard layout and chart selectors stable', () => {
    expectRuleDeclaration('.real-estate-layout', 'align-items: start;');
    expect(styles).toContain('grid-template-columns: 270px minmax(0, 1fr)');
    expectRuleDeclaration('.real-estate-target-list', 'align-content: start;');
    expect(styles).toContain('.real-estate-chart-line.actual');
    expectRuleDeclaration('.real-estate-current-guide', 'stroke: #334155;');
    expectRuleDeclaration('.real-estate-range-marker-box', 'fill: rgba(34, 197, 94, 0.18);');
    expectRuleDeclaration('.real-estate-range-marker-label', 'fill: #0f766e;');
    expectRuleDeclaration('.real-estate-range-marker-value', 'fill: #152238;');
    expect(styles).toContain('@media (max-width: 900px)');
  });
});
