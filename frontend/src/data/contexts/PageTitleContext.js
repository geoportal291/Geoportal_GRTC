import React, { createContext, useContext, useState, useEffect } from 'react';

// Crear el contexto
const PageTitleContext = createContext();

// Proveedor del contexto
export const PageTitleProvider = ({ children }) => {
  const [pageTitle, setPageTitle] = useState(() => {
    const savedPageTitle = localStorage.getItem('pageTitle');
    return savedPageTitle ? savedPageTitle : '';
  });

  useEffect(() => {
    localStorage.setItem('pageTitle', pageTitle);
  }, [pageTitle]);
  
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};

// Hook para consumir el contexto
export const usePageTitle = () => {
  return useContext(PageTitleContext);
};
