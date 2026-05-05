export type Metric = {
  label: string;
  value: string;
  detail: string;
};

export type Project = {
  title: string;
  summary: string;
  tags: string[];
  status: string;
  link: string;
};

export type Article = {
  title: string;
  summary: string;
  topic: string;
  date: string;
  link: string;
};

export type StackGroup = {
  name: string;
  tools: string[];
};

export type ProfileLink = {
  label: string;
  href: string;
};

export const metrics: Metric[] = [
  {
    label: 'Selected projects',
    value: '04',
    detail: 'Interfaces, dashboards, and publishing tools',
  },
  {
    label: 'Writing tracks',
    value: '12',
    detail: 'Notes on React, product thinking, and systems',
  },
  {
    label: 'Core stack',
    value: '08',
    detail: 'Frontend, automation, and deployment tools',
  },
];

export const projects: Project[] = [
  {
    title: 'Signal Board',
    summary:
      'A compact operations dashboard for tracking project signals, decisions, and delivery health in one place.',
    tags: ['React', 'Dashboard', 'Data UX'],
    status: 'Featured',
    link: 'https://github.com/',
  },
  {
    title: 'Article Console',
    summary:
      'A writing workspace that organizes drafts, references, publishing status, and topic trails for recurring essays.',
    tags: ['TypeScript', 'Publishing', 'Workflow'],
    status: 'In progress',
    link: 'https://github.com/',
  },
  {
    title: 'Portfolio System',
    summary:
      'A static-first personal site architecture designed for fast updates, clean deployment, and focused presentation.',
    tags: ['Vite', 'GitHub Pages', 'Design System'],
    status: 'Live',
    link: 'https://github.com/',
  },
];

export const articles: Article[] = [
  {
    title: 'Building Calm Interfaces',
    summary:
      'How restrained layouts, predictable states, and compact hierarchy make dashboards easier to scan repeatedly.',
    topic: 'Interface Design',
    date: '2026.05.03',
    link: 'https://github.com/',
  },
  {
    title: 'Static Sites That Stay Maintainable',
    summary:
      'A practical structure for content arrays, components, tests, and static deployment without adding a CMS too early.',
    topic: 'Frontend',
    date: '2026.04.22',
    link: 'https://github.com/',
  },
  {
    title: 'What Belongs on a Work Overview',
    summary:
      'Choosing the few signals that help visitors understand your work without forcing them through a long landing page.',
    topic: 'Portfolio',
    date: '2026.04.10',
    link: 'https://github.com/',
  },
];

export const stackGroups: StackGroup[] = [
  {
    name: 'Frontend',
    tools: ['React', 'TypeScript', 'Vite', 'CSS'],
  },
  {
    name: 'Product',
    tools: ['Information Architecture', 'Design Systems', 'Dashboards'],
  },
  {
    name: 'Delivery',
    tools: ['GitHub Pages', 'Testing Library', 'Vitest'],
  },
];

export const profileLinks: ProfileLink[] = [
  { label: 'GitHub', href: 'https://github.com/' },
  { label: 'Email', href: 'mailto:hello@example.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
];
