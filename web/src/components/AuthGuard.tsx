import { useEffect, useState, type ReactNode } from 'react';
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
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    setAuth(isAuthenticated());
  }, []);

  if (auth === null) return null;
  return auth ? <>{children}</> : <Unauthorized />;
}
