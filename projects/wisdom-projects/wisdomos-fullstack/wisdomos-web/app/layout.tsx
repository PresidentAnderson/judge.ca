import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'WisdomOS - Your Personal Wisdom Tracker',
  description: 'A Next.js application for wisdom tracking, journaling, and habit formation',
  keywords: ['wisdom', 'journaling', 'habits', 'personal development', 'mindfulness'],
  authors: [{ name: 'WisdomOS Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50">
        <div className="min-h-full">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}