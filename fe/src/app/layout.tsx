import type { Metadata } from 'next';
import AppShell from '@/components/layout/AppShell';
import FloatingSettings from '@/components/layout/FloatingSettings';
import { SettingsProvider } from '@/context/SettingsContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: '센드온 AI 스튜디오',
  description: 'AI 메시지 작성 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="sendon">
      <body>
        <SettingsProvider>
          <AppShell>{children}</AppShell>
          <FloatingSettings />
        </SettingsProvider>
      </body>
    </html>
  );
}
