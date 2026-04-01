import type { ReactNode } from 'react';
import { Unauthorized } from './Unauthorized';

function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') ?? 'null');
    return !!token && !!user;
  } catch {
    return false;
  }
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const auth = isAuthenticated();
  return auth ? <>{children}</> : <Unauthorized />;
}
