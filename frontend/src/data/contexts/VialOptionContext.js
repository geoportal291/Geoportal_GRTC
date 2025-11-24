import React, { createContext, useContext, useState } from 'react';

const VialOptionContext = createContext(null);

export const useVialOption = () => {
  return useContext(VialOptionContext);
};

export const VialOptionProvider = ({ children, value }) => {
  return (
    <VialOptionContext.Provider value={value}>
      {children}
    </VialOptionContext.Provider>
  );
};