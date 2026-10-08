import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { GlobalChrome } from '@/components/GlobalChrome';

export const viewport: Viewport = {
  themeColor: '#177245',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://diet-asisstant-app.vercel.app'),
  title: 'Nutriq — AI-Powered Nutrition & Fitness Planner',
  description: 'Get a personalized diet plan based on your goals, lifestyle, and location. Powered by smart AI nutrition science.',
  keywords: ['diet plan', 'nutrition', 'weight loss', 'meal plan', 'BMI calculator', 'fitness', 'calorie tracker'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nutriq',
    description: 'Your personal AI nutrition coach',
    type: 'website',
  },
  verification: {
    google: '_O3jFaMKeggtCMbXhQ7ba6OVyuCQzc-p0sU7ar0Zilo',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GlobalChrome />
        <main id="main-content">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
