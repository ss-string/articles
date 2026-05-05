import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

describe('styles.css layout regressions', () => {
  it('keeps the workspace in the content column when the sidebar is collapsed', () => {
    expect(styles).toContain('.workspace {');
    expect(styles).toContain('grid-column: 2;');
    expect(styles).toContain('.app-shell.sidebar-collapsed .workspace');
    expect(styles).toContain('grid-column: 2;');
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
