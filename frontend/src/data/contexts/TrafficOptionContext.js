import React, { createContext, useContext } from 'react';

const TrafficOptionContext = createContext(null);

export const useTrafficOption = () => {
  return useContext(TrafficOptionContext);
};

export const TrafficOptionProvider = ({ children, value }) => {
  return (
    <TrafficOptionContext.Provider value={value}>
      {children}
    </TrafficOptionContext.Provider>
  );
};