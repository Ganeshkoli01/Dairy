import React, { useState, useEffect } from 'react';
import { Bell, Check, Package, ShoppingCart, IndianRupee, Activity, AlertTriangle, ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react';
import { notificationApi, NotificationData } from '../api/notificationApi';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
  };

  const handleToggleRead = async (e: React.MouseEvent, notification: NotificationData) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(notification._id);
      setNotifications(notifications.map(n => n._id === notification._id ? { ...n, isRead: !n.isRead } : n));
    } catch (err) {
      console.error('Failed to toggle read status', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER': return <ShoppingCart className="w-6 h-6 text-emerald-400" />;
      case 'PAYMENT_RECEIVED': return <IndianRupee className="w-6 h-6 text-emerald-400" />;
      case 'PAYMENT_FAILED': return <AlertTriangle className="w-6 h-6 text-rose-400" />;
      case 'LOW_STOCK': 
      case 'OUT_OF_STOCK': return <Package className="w-6 h-6 text-amber-400" />;
      case 'MILK_COLLECTION': return <Activity className="w-6 h-6 text-cyan-400" />;
      default: return <Bell className="w-6 h-6 text-indigo-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            <p className="text-slate-400 mt-1">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              All Notifications
            </h2>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="divide-y divide-slate-800/50 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No notifications found</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 flex items-start gap-4 transition-all cursor-pointer ${
                    notification.isRead 
                      ? 'bg-transparent hover:bg-slate-800/30' 
                      : 'bg-indigo-500/5 hover:bg-indigo-500/10'
                  }`}
                >
                  <div className={`p-3 rounded-full shrink-0 ${notification.isRead ? 'bg-slate-800' : 'bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-medium mb-1 ${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mb-2 ${notification.isRead ? 'text-slate-500' : 'text-slate-400'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {!notification.isRead && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    )}
                    <button
                      onClick={(e) => handleToggleRead(e, notification)}
                      className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                      title={notification.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      {notification.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      className="p-2 rounded-lg bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
