import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/store/auth';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const socket = useSocket();
  const user = useAuth(s => s.user);

  useEffect(() => {
    if (!user) return;
    
    socket.emit('join-room', `user-${user._id}`);
    
    // Customer notifications
    if (user.role === 'customer') {
      socket.on('delivery-assigned', (data) => {
        toast.success('🎯 Your delivery has been assigned to a driver!');
        addNotification('🎯', 'Delivery assigned to driver', data);
      });

      socket.on('delivery-status-updated', (data) => {
        toast.success(data.message);
        addNotification('📦', data.message, data);
      });
    }

    // Driver notifications
    if (user.role === 'driver') {
      socket.on('delivery-assigned', (data) => {
        toast.success('🚚 New delivery assigned to you!');
        addNotification('🚚', 'New delivery assigned', data);
      });
    }

    // Admin notifications
    if (user.role === 'admin') {
      socket.on('admin-delivery-update', (data) => {
        addNotification('📊', data.message, data);
      });
    }

    return () => {
      socket.off('delivery-assigned');
      socket.off('delivery-status-updated');
      socket.off('admin-delivery-update');
    };
  }, [user, socket]);

  const addNotification = (icon: string, message: string, data: any) => {
    const notification = {
      id: Date.now(),
      icon,
      message,
      data,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-xl z-50">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">🔔 Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  <div className="text-4xl mb-2">🔕</div>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                      !notif.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{notif.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notif.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
