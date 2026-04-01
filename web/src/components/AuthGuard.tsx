import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

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
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}
