import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../data/contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_BASE || '';

const useProgresivasData = () => {
  const { user, selectedProjectId } = useAuth();
  const [progresivas, setProgresivas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = user?.token;
    if (!token) {
      // In a real app, you might want to redirect to login or handle this more gracefully
      // For now, we'll just throw an error.
      throw new Error('Token no proporcionado');
    }
    return { Authorization: `Bearer ${token}` };
  }, [user]);

  const fetchProgresivas = useCallback(async () => {
    if (!user) {
      setProgresivas([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const url = selectedProjectId
        ? `${API_URL}/api/progresivas?selectedProjectId=${selectedProjectId}`
        : `${API_URL}/api/progresivas`;

      const res = await axios.get(url, { headers });
      setProgresivas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.message !== 'Token no proporcionado') {
        console.error("Error fetching progresivas:", err);
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedProjectId, getAuthHeaders]);

  useEffect(() => {
    fetchProgresivas();
  }, [fetchProgresivas]);

  return { progresivas, loading, error, fetchProgresivas };
};

export default useProgresivasData;
