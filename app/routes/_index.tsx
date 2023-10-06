import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Corepack Rewards App' },
    { name: 'description', content: 'Welcome to Corepack Rewards App!' },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
      <h1>Welcome to Corepack Rewards App</h1>
    </div>
  );
}
