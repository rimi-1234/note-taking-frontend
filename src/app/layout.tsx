import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Nav } from '@/components/nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secure Notes',
  description: 'Secure note-taking app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-shell">
            <Nav />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
