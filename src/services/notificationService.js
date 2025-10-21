// Basic notification service (replacement for deleted notificationService)
import { useState } from 'react';

const notificationService = {
  showSuccess: (message) => {
    console.log('SUCCESS:', message);
    // You can replace this with a toast notification or alert
    alert(`Success: ${message}`);
  },

  showError: (message) => {
    console.error('ERROR:', message);
    // You can replace this with a toast notification or alert
    alert(`Error: ${message}`);
  },

  showWarning: (message) => {
    console.warn('WARNING:', message);
    // You can replace this with a toast notification or alert
    alert(`Warning: ${message}`);
  },

  showInfo: (message) => {
    console.info('INFO:', message);
    // You can replace this with a toast notification or alert
    alert(`Info: ${message}`);
  }
};

// Hook for managing notifications state
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = { id, ...notification, timestamp: new Date() };
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showSuccess = (message) => {
    notificationService.showSuccess(message);
    return addNotification({ type: 'success', message });
  };

  const showError = (message) => {
    notificationService.showError(message);
    return addNotification({ type: 'error', message });
  };

  const showWarning = (message) => {
    notificationService.showWarning(message);
    return addNotification({ type: 'warning', message });
  };

  const showInfo = (message) => {
    notificationService.showInfo(message);
    return addNotification({ type: 'info', message });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default notificationService;