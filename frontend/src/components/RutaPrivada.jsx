import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../data/contexts/AuthContext';

export default function RutaPrivada({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}
