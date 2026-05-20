import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

let idCounter = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = ++idCounter;
    const item = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      ...notification,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 20));
    if (item.duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, item.duration);
    }
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback(
    (message, title = 'Success') => addNotification({ type: 'success', title, message }),
    [addNotification]
  );

  const error = useCallback(
    (message, title = 'Error') => addNotification({ type: 'error', title, message }),
    [addNotification]
  );

  const warning = useCallback(
    (message, title = 'Warning') => addNotification({ type: 'warning', title, message }),
    [addNotification]
  );

  const info = useCallback(
    (message, title = 'Info') => addNotification({ type: 'info', title, message }),
    [addNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
