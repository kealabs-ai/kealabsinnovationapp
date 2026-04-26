import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../lib/useUser';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useUser();

  // Assuming an empty email in the user profile means the user is not authenticated
  if (!user || !user.email) {
    return <Navigate to="/login" replace />;
  }
  return children;
}