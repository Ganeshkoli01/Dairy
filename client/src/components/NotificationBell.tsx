import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Package, ShoppingCart, IndianRupee, Activity, AlertTriangle } from 'lucide-react';
import { notificationApi, NotificationData } from '../api/notificationApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification._id);
        setNotifications(notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (err) {}
    }
    setIsOpen(false);
    
    // Navigate to the dedicated notifications page
    navigate('/notifications');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER': return <ShoppingCart className="w-5 h-5 text-emerald-400" />;
      case 'PAYMENT_RECEIVED': return <IndianRupee className="w-5 h-5 text-emerald-400" />;
      case 'PAYMENT_FAILED': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'LOW_STOCK': 
      case 'OUT_OF_STOCK': return <Package className="w-5 h-5 text-amber-400" />;
      case 'MILK_COLLECTION': return <Activity className="w-5 h-5 text-cyan-400" />;
      default: return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white transition rounded-full hover:bg-slate-800 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 border-2 border-slate-900 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {notifications.map((n) => (
                  <div 
                    key={n._id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-colors flex gap-4 ${n.isRead ? 'opacity-60' : 'bg-slate-800/20'}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="flex-shrink-0 flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors w-full"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
