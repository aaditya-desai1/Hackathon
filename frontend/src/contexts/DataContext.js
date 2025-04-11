import React, { createContext, useContext, useState, useCallback } from 'react';

// Create a context for managing data refresh across components
const DataContext = createContext({
  refreshData: () => {},
  isRefreshing: false,
  lastRefresh: null
});

// Provider component to wrap the app
export const DataProvider = ({ children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Function to trigger a data refresh across components
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    
    // Reset the refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
    
    // Broadcast a refresh event for components that don't use the context
    const refreshEvent = new CustomEvent('data-refresh');
    window.dispatchEvent(refreshEvent);
    
    console.log('[DataContext] Data refresh triggered');
  }, []);

  return (
    <DataContext.Provider value={{ refreshData, isRefreshing, lastRefresh }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useDataContext = () => useContext(DataContext);

export default DataContext; 