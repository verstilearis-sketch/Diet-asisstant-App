import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — Zaiq',
  description: 'Sign in to Zaiq with Google to access your personalized diet plan, meal tracker, and AI nutrition coach.',
  alternates: {
    canonical: '/auth',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
