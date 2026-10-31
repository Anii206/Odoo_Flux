import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../../types';

interface ProtectedRouteProps {
  user: User | null;
  loading?: boolean;
  allowedRoles?: ('admin' | 'staff' | 'customer')[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  loading = false,
  allowedRoles,
  children,
}) => {
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-[#888888]">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/workspace" replace />;
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};
