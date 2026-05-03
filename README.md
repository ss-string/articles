# Articles Portfolio Dashboard

React single-page portfolio dashboard for GitHub Pages.

## Scripts

```bash
npm install
npm run dev
npm test
npm run build
```

## Development

Run the local development server:

```bash
npm run dev
```

The app is a static React SPA with section navigation for:

- Overview
- Work
- Writing
- Stack
- Contact

Content is stored in `src/content.ts` so projects, articles, stack groups, and profile links can be edited without changing the layout code.

## Testing

Run the render tests:

```bash
npm test
```

The tests verify that the dashboard sections render, representative portfolio/article content appears, and external profile links use safe new-tab attributes.

## GitHub Pages

The Vite config uses:

```ts
base: '/articles/'
```

This matches GitHub Pages deployment from a repository named `articles`, where the site is served from `/articles/`.

Build the static site:

```bash
npm run build
```

The production output is written to `dist/`.
