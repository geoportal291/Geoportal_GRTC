import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import axiosInstance from '../../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("fallo al parse user from localStorage", error);
      return null;
    }
  });

  const [assignedProjects, setAssignedProjects] = useState([]);
  const [showProjectSelectionModal, setShowProjectSelectionModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('selectedProjectId') || null);
  const [selectedProjectName, setSelectedProjectName] = useState(() => localStorage.getItem('selectedProjectName') || null);

  const API_URL = process.env.REACT_APP_API_BASE || '';

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProjectId');
      localStorage.removeItem('selectedProjectName');
    }
  }, [user]);

  const fetchAssignedProjects = useCallback(async (userId, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/user-projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const projects = response.data;

      if (projects.length === 0) {
        setSelectedProjectId(null);
        setSelectedProjectName(null);
        localStorage.removeItem('selectedProjectId');
        localStorage.removeItem('selectedProjectName');
      } else if (projects.length === 1) {
        setSelectedProjectId(projects[0].proyecto_id);
        setSelectedProjectName(projects[0].nombre_proyecto);
        localStorage.setItem('selectedProjectId', projects[0].proyecto_id);
        localStorage.setItem('selectedProjectName', projects[0].nombre_proyecto);
        setShowProjectSelectionModal(false);
      } else {
        // Multiple projects, always store the list of available projects.
        setAssignedProjects(projects);

        // Check if one was previously selected and is still valid
        const storedProjectId = localStorage.getItem('selectedProjectId');
        const storedProjectName = localStorage.getItem('selectedProjectName');
        const previouslySelectedIsValid = projects.some(p => p.proyecto_id.toString() === storedProjectId);

        if (storedProjectId && previouslySelectedIsValid) {
          setSelectedProjectId(storedProjectId);
          setSelectedProjectName(storedProjectName);
          setShowProjectSelectionModal(false);
        } else {
          setShowProjectSelectionModal(true);
          setSelectedProjectId(null); // Clear previous selection if invalid or not set
          setSelectedProjectName(null);
          localStorage.removeItem('selectedProjectId');
          localStorage.removeItem('selectedProjectName');
        }
      }
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
      alertify.error('Error al cargar los proyectos asignados.');
      // Handle error, maybe clear project selection
      setSelectedProjectId(null);
      setSelectedProjectName(null);
      localStorage.removeItem('selectedProjectId');
      localStorage.removeItem('selectedProjectName');
      setAssignedProjects([]);
      setShowProjectSelectionModal(false);
    }
  }, [API_URL, setSelectedProjectId, setSelectedProjectName, setAssignedProjects, setShowProjectSelectionModal]);

  useEffect(() => {
    if (user && !selectedProjectId) {
      // If user is logged in but no project is selected (e.g., first login or refresh without selection)
      fetchAssignedProjects(user.id, user.token);
    }
  }, [user, selectedProjectId, fetchAssignedProjects]);

  const login = async (userData) => {
    setUser(userData);
    // After login, fetch assigned projects
    if (userData && userData.id && userData.token) {
      await fetchAssignedProjects(userData.id, userData.token);
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedProjectId(null);
    setSelectedProjectName(null);
    localStorage.removeItem('selectedProjectId');
    localStorage.removeItem('selectedProjectName');
    setAssignedProjects([]);
    setShowProjectSelectionModal(false);
  };

  const selectProject = (projectId, projectName) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    localStorage.setItem('selectedProjectId', projectId);
    localStorage.setItem('selectedProjectName', projectName);
    setShowProjectSelectionModal(false);
  };

  const openProjectSwitcher = () => {
    setShowProjectSelectionModal(true);
  };

  const getAuthHeaders = useCallback(() => {
    if (!user || !user.token) {
      // This can happen on initial load or after logout
      // The component calling this should handle the navigation
      throw new Error('Token no proporcionado');
    }
    return { Authorization: `Bearer ${user.token}` };
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      selectedProjectId, selectedProjectName, selectProject, openProjectSwitcher,
      assignedProjects, showProjectSelectionModal,
      API_URL, getAuthHeaders // <-- EXPORT NEW VALUES
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
