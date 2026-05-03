# Portfolio Dashboard SPA Design

## Goal

Build a single-page React website for GitHub Pages that presents a personal portfolio and article list as a dashboard-style experience.

The site should be inspired by `https://www.ddangsok.com/dashboard`: a left navigation area, dashboard greeting/overview, grouped content sections, and scan-friendly cards. The final result should feel more portfolio-focused than a news feed.

## Deployment Target

- Static GitHub Pages deployment from this repository.
- Repository path is expected to be `/articles/`.
- Vite should use `base: '/articles/'` so built assets resolve correctly on GitHub Pages.
- The app should not depend on a runtime backend.

## Information Architecture

The SPA has one page with section-based navigation:

- `Overview`: short introduction, role/interests, contact call to action, and compact dashboard metrics.
- `Work`: featured portfolio projects.
- `Writing`: recent blog posts or article entries.
- `Stack`: technologies and tools grouped by area.
- `Contact`: GitHub, email, and other profile links.

Navigation should scroll to sections rather than changing routes. This keeps GitHub Pages deployment simple and avoids refresh-related routing issues.

## Layout

Desktop layout:

- Persistent left sidebar with the owner name or brand at the top.
- Sidebar navigation links: Overview, Work, Writing, Stack, Contact.
- Main content area uses dashboard cards and content groups.
- First viewport should clearly show that this is a portfolio dashboard, not a generic landing page.

Mobile layout:

- Sidebar collapses into a compact top navigation.
- Cards stack into a single column.
- Text and buttons must fit without overlap.

## Visual Direction

Use a dark portfolio dashboard style:

- Dark main background.
- High-contrast light text.
- Muted borders and panels.
- One or two accent colors for status chips, links, and active navigation.
- Cards should be restrained, with border radius at 8px or less.

The design should prioritize repeated scanning over marketing-style hero composition.

## Content Model

Content can be stored as local arrays in the React app:

- `projects`: title, summary, tags, status or year, optional link.
- `articles`: title, summary, topic, date, optional link.
- `stackGroups`: category name and tools.
- `profileLinks`: label and URL.

This keeps the first version simple. The structure should make it easy to replace local data with Markdown or generated JSON later.

## Components

Suggested component boundaries:

- `App`: page shell and section composition.
- `Sidebar`: desktop navigation and profile label.
- `TopNav`: mobile navigation.
- `Section`: shared section wrapper.
- `MetricCard`: dashboard stat cards.
- `ProjectCard`: portfolio project display.
- `ArticleItem`: article list item.
- `StackGroup`: grouped technology list.
- `ContactPanel`: contact links and call to action.

These boundaries keep display components small and make tests straightforward.

## Behavior

- Navigation links scroll to their matching section anchors.
- External links open in a new tab with safe `rel` attributes.
- The app should render useful sample content without requiring user-provided data.
- No login, backend, CMS, comments, search, filtering, or client-side routing is included in this version.

## Testing

Use focused frontend verification:

- Render test confirms the main dashboard title and primary sections appear.
- Render test confirms representative project and article content appears.
- Build verification confirms Vite can produce a static GitHub Pages-ready bundle.

## Acceptance Criteria

- A React SPA exists and runs locally.
- The page presents a portfolio dashboard with Overview, Work, Writing, Stack, and Contact sections.
- Layout is responsive for desktop and mobile.
- GitHub Pages asset base is configured for `/articles/`.
- Tests and production build pass.
