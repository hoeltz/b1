// Real-time Notification and Alert System for FreightFlow
import React from 'react';

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

export const NOTIFICATION_CATEGORIES = {
  ORDER: 'order',
  INVOICE: 'invoice',
  SHIPMENT: 'shipment',
  CUSTOMER: 'customer',
  SYSTEM: 'system',
  FINANCIAL: 'financial',
};

export const ALERT_TRIGGERS = {
  // Invoice alerts
  INVOICE_OVERDUE: 'invoice_overdue',
  INVOICE_DUE_SOON: 'invoice_due_soon',
  HIGH_VALUE_INVOICE: 'high_value_invoice',

  // Order alerts
  HIGH_VALUE_ORDER: 'high_value_order',
  ORDER_PENDING_APPROVAL: 'order_pending_approval',
  ORDER_STATUS_CHANGED: 'order_status_changed',

  // Customer alerts
  CUSTOMER_CREDIT_LIMIT: 'customer_credit_limit',
  NEW_CUSTOMER: 'new_customer',

  // System alerts
  DATA_BACKUP_REMINDER: 'data_backup_reminder',
  SYSTEM_ERROR: 'system_error',
  STORAGE_FULL: 'storage_full',
};

class NotificationService {
  constructor() {
    this.notifications = [];
    this.alerts = [];
    this.subscribers = [];
    this.periodicCheckInterval = null;
    this.isNotifying = false;
    this.settings = {
      enableSound: true,
      enableDesktopNotification: true,
      autoHideDelay: 5000,
      maxNotifications: 50,
    };

    // Request notification permission
    this.requestNotificationPermission();

    // Set up periodic checks only once
    this.setupPeriodicChecks();
  }

  // Subscribe to notifications
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Notify all subscribers - prevent infinite loops
  notify(notification) {
    if (!notification || this.isNotifying) {
      return; // Prevent recursive notifications
    }

    this.isNotifying = true;
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
    // Reset the flag after a short delay to allow for cascading notifications
    setTimeout(() => {
      this.isNotifying = false;
    }, 100);
  }

  // Add a notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };

    this.notifications.unshift(newNotification);

    // Limit notifications
    if (this.notifications.length > this.settings.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.settings.maxNotifications);
    }

    // Play sound if enabled
    if (this.settings.enableSound) {
      this.playNotificationSound(notification.type);
    }

    // Show desktop notification if enabled
    if (this.settings.enableDesktopNotification && 'Notification' in window) {
      this.showDesktopNotification(newNotification);
    }

    // Auto-hide after delay (except critical)
    if (notification.type !== NOTIFICATION_TYPES.CRITICAL && this.settings.autoHideDelay > 0) {
      setTimeout(() => {
        this.markAsRead(newNotification.id);
      }, this.settings.autoHideDelay);
    }

    this.notify(newNotification);
    return newNotification.id;
  }

  // Mark notification as read
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notify({ type: 'notification_updated', notification });
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notify({ type: 'all_notifications_read' });
  }

  // Remove notification
  removeNotification(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      const removed = this.notifications.splice(index, 1)[0];
      this.notify({ type: 'notification_removed', notification: removed });
    }
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notify({ type: 'notifications_cleared' });
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get notifications by type
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  // Get notifications by category
  getNotificationsByCategory(category) {
    return this.notifications.filter(n => n.category === category);
  }

  // Create specific notification types
  showSuccess(message, category = NOTIFICATION_CATEGORIES.SYSTEM, autoHide = true) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      category,
      message,
      autoHide,
    });
  }

  showError(message, category = NOTIFICATION_CATEGORIES.SYSTEM, error = null) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      category,
      message,
      error,
      autoHide: false,
    });
  }

  showWarning(message, category = NOTIFICATION_CATEGORIES.SYSTEM) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      category,
      message,
      autoHide: true,
    });
  }

  showInfo(message, category = NOTIFICATION_CATEGORIES.SYSTEM) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.INFO,
      category,
      message,
      autoHide: true,
    });
  }

  // Alert system
  addAlert(alert) {
    const newAlert = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      acknowledged: false,
      ...alert,
    };

    this.alerts.unshift(newAlert);
    this.notify({ type: 'alert_added', alert: newAlert });

    // Auto-create notification for alert
    this.addNotification({
      type: alert.severity === 'critical' ? NOTIFICATION_TYPES.CRITICAL : NOTIFICATION_TYPES.WARNING,
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      message: alert.message,
      alertId: newAlert.id,
    });

    return newAlert.id;
  }

  acknowledgeAlert(id) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      this.notify({ type: 'alert_acknowledged', alert });
    }
  }

  // Periodic alert checks - only setup once
  setupPeriodicChecks() {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
    }

    // Check every 5 minutes
    this.periodicCheckInterval = setInterval(() => {
      this.performPeriodicChecks();
    }, 5 * 60 * 1000);
  }

  performPeriodicChecks() {
    // This would typically check for overdue invoices, etc.
    // For now, we'll implement basic checks
    this.checkForOverdueInvoices();
    this.checkForHighValueOrders();
  }

  checkForOverdueInvoices() {
    // This would be implemented with actual data
    // For demo purposes, we'll simulate occasional alerts
    if (Math.random() < 0.1) { // 10% chance
      this.addAlert({
        type: ALERT_TRIGGERS.INVOICE_OVERDUE,
        severity: 'warning',
        message: 'Invoice payment is overdue',
        actionRequired: true,
      });
    }
  }

  checkForHighValueOrders() {
    if (Math.random() < 0.05) { // 5% chance
      this.addAlert({
        type: ALERT_TRIGGERS.HIGH_VALUE_ORDER,
        severity: 'info',
        message: 'High-value order requires attention',
        actionRequired: false,
      });
    }
  }

  // Desktop notification support
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.settings.enableDesktopNotification = permission === 'granted';
    }
  }

  showDesktopNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === NOTIFICATION_TYPES.CRITICAL,
        silent: !this.settings.enableSound,
      };

      const desktopNotification = new Notification(
        `FreightFlow - ${notification.type.toUpperCase()}`,
        options
      );

      desktopNotification.onclick = () => {
        this.markAsRead(notification.id);
        window.focus();
        desktopNotification.close();
      };

      // Auto-close after delay
      if (notification.type !== NOTIFICATION_TYPES.CRITICAL) {
        setTimeout(() => {
          desktopNotification.close();
        }, this.settings.autoHideDelay);
      }
    }
  }

  // Sound notifications
  playNotificationSound(type) {
    // In a real implementation, you would play different sounds for different types
    // For now, we'll use a simple beep (if supported)
    try {
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = type === NOTIFICATION_TYPES.ERROR ? 150 : 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Export notifications for backup
  exportNotifications() {
    return {
      notifications: this.notifications,
      alerts: this.alerts,
      exportedAt: new Date().toISOString(),
    };
  }

  // Import notifications from backup
  importNotifications(data) {
    if (data.notifications) {
      this.notifications = data.notifications;
    }
    if (data.alerts) {
      this.alerts = data.alerts;
    }
    this.notify({ type: 'notifications_imported' });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// React hook for using notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState(notificationService.notifications);
  const [alerts, setAlerts] = React.useState(notificationService.alerts);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = notificationService.subscribe((update) => {
      if (update.type === 'notification_updated' || update.type === 'notification_removed' || update.type === 'notifications_cleared') {
        setNotifications([...notificationService.notifications]);
        setUnreadCount(notificationService.getUnreadCount());
      } else if (update.type === 'alert_added' || update.type === 'alert_acknowledged') {
        setAlerts([...notificationService.alerts]);
      }
    });

    // Initial state
    setNotifications([...notificationService.notifications]);
    setAlerts([...notificationService.alerts]);
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, []);

  return {
    notifications,
    alerts,
    unreadCount,
    addNotification: notificationService.addNotification.bind(notificationService),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    removeNotification: notificationService.removeNotification.bind(notificationService),
    clearAll: notificationService.clearAll.bind(notificationService),
    showSuccess: notificationService.showSuccess.bind(notificationService),
    showError: notificationService.showError.bind(notificationService),
    showWarning: notificationService.showWarning.bind(notificationService),
    showInfo: notificationService.showInfo.bind(notificationService),
  };
};

export default notificationService;