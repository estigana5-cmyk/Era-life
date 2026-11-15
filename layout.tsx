import type { Metadata } from 'next';
import './globals.css';
import ServiceWorker from './ServiceWorker';

export const metadata: Metadata = {
  title: 'Life Era — Your life, organized',
  description: 'مساحتك الشخصية لتنظيم العادات والأهداف والإنجازات',
  manifest: '/manifest.webmanifest',
  applicationName: 'Life Era',
  themeColor: '#172b36',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}<ServiceWorker /></body></html>;
}
