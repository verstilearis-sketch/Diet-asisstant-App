import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nutriq — AI-Powered Nutrition & Fitness Planner',
  description: 'Get a personalized diet plan based on your goals, lifestyle, and location. Powered by smart AI nutrition science.',
  keywords: ['diet plan', 'nutrition', 'weight loss', 'meal plan', 'BMI calculator', 'fitness', 'calorie tracker'],
  openGraph: {
    title: 'Nutriq',
    description: 'Your personal AI nutrition coach',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
