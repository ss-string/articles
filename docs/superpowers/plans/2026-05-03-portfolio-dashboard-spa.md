# Portfolio Dashboard SPA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React single-page portfolio dashboard and article list that deploys cleanly to GitHub Pages at `/articles/`.

**Architecture:** Use Vite with React and TypeScript for a static SPA. Keep content in typed local arrays, compose the page from small presentational components, and use anchor navigation instead of client-side routing.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, CSS.

---

## File Structure

- Create `package.json`: scripts and dependencies for Vite, testing, and GitHub Pages deployment.
- Create `index.html`: Vite HTML entry point.
- Create `vite.config.ts`: React plugin, Vitest environment, and `base: '/articles/'`.
- Create `tsconfig.json`, `tsconfig.node.json`: TypeScript compiler settings.
- Create `src/main.tsx`: React root bootstrap.
- Create `src/App.tsx`: page composition and section wiring.
- Create `src/content.ts`: typed portfolio, article, stack, metric, and profile link data.
- Create `src/App.test.tsx`: render tests for dashboard sections and representative content.
- Create `src/setupTests.ts`: Testing Library matchers.
- Create `src/styles.css`: responsive dashboard styling.

## Task 1: Scaffold Vite React Project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/setupTests.ts`

- [ ] **Step 1: Create project configuration**

Write `package.json` with:

```json
{
  "name": "articles",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Create Vite entry files**

Write `index.html` with a `root` element and `src/main.tsx` script. Write `src/main.tsx` to render `<App />` inside `StrictMode`. Write `src/setupTests.ts` to import `@testing-library/jest-dom/vitest`.

- [ ] **Step 3: Configure TypeScript and Vite**

Write `vite.config.ts` with `base: '/articles/'`, `react()` plugin, and Vitest `jsdom` setup. Write `tsconfig.json` and `tsconfig.node.json` for strict React TypeScript compilation.

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: `node_modules/` and `package-lock.json` are created with no install failure.

- [ ] **Step 5: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/setupTests.ts
git commit -m "chore: scaffold React dashboard app"
```

## Task 2: Add Content Data With Failing Render Test

**Files:**
- Create: `src/content.ts`
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Write the failing render test**

Write `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Portfolio dashboard', () => {
  it('renders primary dashboard sections', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /portfolio dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /featured work/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /writing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /stack/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact/i })).toBeInTheDocument();
  });

  it('renders representative project and article content', () => {
    render(<App />);

    expect(screen.getByText(/signal board/i)).toBeInTheDocument();
    expect(screen.getByText(/building calm interfaces/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `src/App.tsx` does not exist yet.

- [ ] **Step 3: Add local content data**

Write `src/content.ts` with exported arrays for metrics, projects, articles, stack groups, and profile links. Include a project titled `Signal Board` and an article titled `Building Calm Interfaces`.

- [ ] **Step 4: Add minimal app implementation**

Write `src/App.tsx` to render the section headings and representative content from `src/content.ts`. Import `src/styles.css`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit content and render tests**

Run:

```bash
git add src/content.ts src/App.tsx src/App.test.tsx src/styles.css
git commit -m "feat: add portfolio dashboard content"
```

## Task 3: Build Responsive Dashboard Styling

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add accessibility and link test coverage**

Extend `src/App.test.tsx` to verify the GitHub profile link opens in a new tab and has `rel="noreferrer"`.

- [ ] **Step 2: Run test to verify current behavior**

Run: `npm test -- src/App.test.tsx`

Expected: PASS if the initial implementation already includes safe external links, otherwise FAIL with a missing attribute assertion.

- [ ] **Step 3: Complete dashboard markup and CSS**

Update `src/App.tsx` with semantic sections, sidebar navigation, mobile top navigation, project cards, article list, stack groups, and contact links. Update `src/styles.css` with the dark portfolio dashboard layout, responsive breakpoints, visible focus states, and 8px-or-less card radii.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit completed UI**

Run:

```bash
git add src/App.tsx src/styles.css src/App.test.tsx
git commit -m "feat: build responsive portfolio dashboard"
```

## Task 4: Verify GitHub Pages Build

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README**

Write setup, development, test, build, and GitHub Pages notes. Include that Vite uses `/articles/` as the asset base.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: tests pass and `dist/` is created.

- [ ] **Step 3: Commit verification docs**

Run:

```bash
git add README.md
git commit -m "docs: add dashboard app usage notes"
```

## Self-Review

- Spec coverage: Tasks cover React SPA creation, dashboard layout, Overview/Work/Writing/Stack/Contact sections, responsive behavior, local content, GitHub Pages base path, render tests, and production build.
- Placeholder scan: No deferred implementation markers are present.
- Type consistency: Content arrays and tests use consistent names: `Signal Board`, `Building Calm Interfaces`, `Portfolio Dashboard`, `Featured Work`, `Writing`, `Stack`, and `Contact`.
