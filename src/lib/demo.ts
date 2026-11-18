// Must match backend/src/lib/demo.ts. The backend enforces the restrictions; the UI only explains them.
export const DEMO_PASSWORD = 'Demo12345!';

export const demoAccounts = [
  { name: 'Demo Admin', email: 'demo-admin@example.com', role: 'Admin', tagline: 'All users, notes & interests' },
  { name: 'Demo User', email: 'demo-user@example.com', role: 'User', tagline: 'Private notes & posts' },
] as const;

export function isDemoAccount(email: string | undefined): boolean {
  return !!email && demoAccounts.some((account) => account.email === email.toLowerCase());
}
