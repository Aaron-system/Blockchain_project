import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NodeProvider } from '@/contexts/NodeContext';
import { AddressBookProvider } from '@/contexts/AddressBookContext';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blockchain App',
  description: 'A proof-of-work blockchain with wallet, explorer, and visualizer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <NodeProvider>
            <AddressBookProvider>
              <Navbar />
              <main className="pt-24 max-w-7xl mx-auto px-4 py-8">{children}</main>
            </AddressBookProvider>
          </NodeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
