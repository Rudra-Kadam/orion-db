'use client';

import * as React from 'react';
import InkOrbitFeatures from '@/components/ui/ink-orbit-features';

/**
 * Orion's take on the ink-orbit features bento: the three live diagrams retold
 * as realtime channels, generated REST APIs, per-project primitives and query
 * insights. The component's neutral paper/ink palette is re-pointed at the site
 * tokens, and it follows the theme toggle (not just the OS) so it never sits
 * light inside a dark page.
 */
const LIGHT_VARS = {
  '--ib-page': '#fafafa',
  '--ib-hatch': 'rgba(0, 0, 0, 0.04)',
  '--ib-paper': '#ffffff',
  '--ib-card': '#fafafa',
  '--ib-raise': '#ffffff',
  '--ib-ink': '#1c1c1c',
  '--ib-soft': '#3d3d3d',
  '--ib-muted': '#5c5c5c',
  '--ib-faint': '#8c8c8c',
  '--ib-line': '#e6e6e6',
  '--ib-line-strong': '#d4d4d4',
  '--ib-bracket': '#c4c4c4',
  '--ib-inv': '#161616',
  '--ib-inv-ink': '#fafafa',
} as React.CSSProperties;

const DARK_VARS = {
  '--ib-page': '#0a0a0a',
  '--ib-hatch': 'rgba(255, 255, 255, 0.04)',
  '--ib-paper': '#171717',
  '--ib-card': '#1c1c1c',
  '--ib-raise': '#202020',
  '--ib-ink': '#fafafa',
  '--ib-soft': '#d4d4d4',
  '--ib-muted': '#a3a3a3',
  '--ib-faint': '#6b6b6b',
  '--ib-line': '#262626',
  '--ib-line-strong': '#363636',
  '--ib-bracket': '#444444',
  '--ib-inv': '#fafafa',
  '--ib-inv-ink': '#0a0a0a',
} as React.CSSProperties;

export function FeaturesShowcase() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains('dark'));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  return (
    <InkOrbitFeatures
      theme={dark ? 'dark' : 'light'}
      brand="Orion"
      tag="Inside the platform"
      title={'Everything you need,\n*already* wired'}
      collaboration={{
        title: 'Realtime channels',
        description:
          'Every table gets a WebSocket channel. Subscribe once and your app receives each insert, update and delete the moment it commits.',
      }}
      reports={{
        title: 'Auto-generated REST APIs',
        description:
          'Create a table and its endpoints exist — filtering, ordering and pagination included, scoped by your project keys.',
      }}
      integrations={{
        title: 'One project, every primitive',
        description:
          'Postgres schema, storage buckets, end-user auth and API keys live together, so the dashboard, REST API and SDK never disagree.',
        tools: ['Buckets', 'Uploads', 'Sessions', 'API keys'],
      }}
      insights={{
        title: 'Query insights',
        description:
          'Every statement run in the SQL editor is logged with its duration and row count, so slow queries surface before your users notice.',
        values: [18, 22, 21, 27, 25, 31, 30, 36, 41, 45, 52, 60],
        forecastFrom: 8,
      }}
      className="rounded-2xl overflow-hidden"
      style={dark ? DARK_VARS : LIGHT_VARS}
    />
  );
}
