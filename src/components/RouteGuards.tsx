import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import type { ClientType, UserRole } from '../types';

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const RequireRole = ({ role, children }: { role: UserRole; children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const RequireClientType = ({ clientType, children }: { clientType: ClientType; children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const { getClientById } = useDentalFlow();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'super_admin') return <>{children}</>;
  if (currentUser.role !== 'client_admin') return <Navigate to="/" replace />;
  const client = getClientById(currentUser.clientId);
  if (client?.type !== clientType) return <Navigate to="/" replace />;
  return <>{children}</>;
};
