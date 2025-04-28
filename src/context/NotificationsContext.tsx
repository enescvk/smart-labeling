
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'warning' | 'info' | 'success' | 'error';
  link?: string;
  restaurant_id?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { selectedRestaurant } = useRestaurantStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notifications from the database
  useEffect(() => {
    if (!selectedRestaurant?.id) return;

    const fetchNotifications = async () => {
      try {
        // Use the 'from' method with a type assertion to specify the table
        const { data, error } = await supabase
          .from('notifications' as any)
          .select('*')
          .eq('restaurant_id', selectedRestaurant.id)
          .order('timestamp', { ascending: false });

        if (error) throw error;
        
        // Transform database notifications to match our Notification interface
        const formattedNotifications = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          timestamp: new Date(item.timestamp),
          read: item.read,
          type: item.type as 'warning' | 'info' | 'success' | 'error',
          link: item.link,
          restaurant_id: item.restaurant_id
        }));
        
        setNotifications(formattedNotifications);
        
        // Show toast for new unread warnings
        const unreadWarnings = formattedNotifications.filter(n => !n.read && n.type === 'warning');
        unreadWarnings.forEach(notification => {
          toast.warning(notification.title, {
            description: notification.message,
            duration: 10000,
          });
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    
    // Subscribe to real-time changes in the notifications table
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `restaurant_id=eq.${selectedRestaurant.id}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // Add the new notification to our state
          const formattedNotification: Notification = {
            id: newNotification.id,
            title: newNotification.title,
            message: newNotification.message,
            timestamp: new Date(newNotification.timestamp),
            read: newNotification.read,
            type: newNotification.type as 'warning' | 'info' | 'success' | 'error',
            link: newNotification.link,
            restaurant_id: newNotification.restaurant_id
          };
          
          setNotifications(prev => [formattedNotification, ...prev]);
          
          // Show toast for new warning
          if (formattedNotification.type === 'warning') {
            toast.warning(formattedNotification.title, {
              description: formattedNotification.message,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();
      
    // Set up periodic polling for notifications (as a backup for realtime)
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [selectedRestaurant?.id]);

  const markAsRead = async (id: string) => {
    try {
      // Update in the database
      const { error } = await supabase
        .from('notifications' as any)
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update in local state
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!selectedRestaurant?.id) return;
      
      // Update all notifications for this restaurant in the database
      const { error } = await supabase
        .from('notifications' as any)
        .update({ read: true })
        .eq('restaurant_id', selectedRestaurant.id)
        .eq('read', false);
        
      if (error) throw error;
      
      // Update in local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      // Delete from the database
      const { error } = await supabase
        .from('notifications' as any)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      dismissNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
