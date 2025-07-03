import React, { useState, useEffect } from 'react';
import { useNotifications, Notification } from './NotificationProvider';
import './NotificationContainer.css';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(enterTimer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 300); // Match CSS transition duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div
      className={`notification-item ${notification.type} ${
        isVisible ? 'visible' : ''
      } ${isExiting ? 'exiting' : ''}`}
    >
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        {notification.message && (
          <div className="notification-message">{notification.message}</div>
        )}
        
        {notification.actions && notification.actions.length > 0 && (
          <div className="notification-actions">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                className={`notification-action ${action.variant || 'secondary'}`}
                onClick={() => {
                  action.onClick();
                  handleRemove();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button
        className="notification-close"
        onClick={handleRemove}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationContainer;