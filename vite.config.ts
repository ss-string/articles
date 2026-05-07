import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { appBasePath } from './src/appBasePath';

export function resolveEnvDir(currentDirectory = process.cwd()) {
  const worktreeMarker = `${path.sep}.worktrees${path.sep}`;
  const markerIndex = currentDirectory.indexOf(worktreeMarker);

  if (markerIndex === -1) {
    return currentDirectory;
  }

  return currentDirectory.slice(0, markerIndex);
}

export default defineConfig({
  base: appBasePath,
  envDir: resolveEnvDir(),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
});
