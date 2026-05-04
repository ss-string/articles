import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveEnvDir } from './vite.config';

describe('vite envDir resolution', () => {
  it('uses the parent project root when running inside a feature worktree', () => {
    const worktreeDirectory = path.join(
      path.sep,
      'Users',
      'sunghyun',
      'project',
      'articles',
      '.worktrees',
      'ranking-popup-details',
    );

    expect(resolveEnvDir(worktreeDirectory)).toBe(path.join(path.sep, 'Users', 'sunghyun', 'project', 'articles'));
  });

  it('uses the current project directory outside worktrees', () => {
    const projectDirectory = path.join(path.sep, 'Users', 'sunghyun', 'project', 'articles');

    expect(resolveEnvDir(projectDirectory)).toBe(projectDirectory);
  });
});
