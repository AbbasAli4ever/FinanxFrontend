import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PermissionsProvider } from '@/context/PermissionsContext';

export const metadata: Metadata = {
  icons: {
    icon: '/images/logo/f-logo.png',
    shortcut: '/images/logo/f-logo.png',
    apple: '/images/logo/f-logo.png',
  },
};

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lato.className} dark:bg-gray-900`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <PermissionsProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </PermissionsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
