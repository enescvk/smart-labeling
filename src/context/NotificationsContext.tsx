
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { toast } from 'sonner';
import { PrepWatchRule } from '@/components/admin/PrepWatchTab';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'warning' | 'info' | 'success' | 'error';
  link?: string;
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

  // Function to check inventory levels against prep watch rules
  const checkInventoryLevels = async () => {
    if (!selectedRestaurant?.id) return;

    try {
      // Get active prep watch rules
      const { data: rules, error: rulesError } = await supabase
        .from('prep_watch_settings')
        .select('*')
        .eq('restaurant_id', selectedRestaurant.id);

      if (rulesError) throw rulesError;

      // For each rule, check active inventory counts
      for (const rule of rules as PrepWatchRule[]) {
        const now = new Date();
        const ruleHour = rule.check_hour;
        const ruleMinute = rule.check_minute;
        
        // Get the current time in the local timezone
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Simple check: if the current time matches or just passed the rule's check time
        // In a real app, you'd want more sophisticated time checking with proper timezone handling
        if (currentHour === ruleHour && currentMinute >= ruleMinute) {
          // Only check within 10 minutes of the scheduled time to avoid duplicate checks
          if (currentMinute < ruleMinute + 10) {
            await checkRuleCondition(rule);
          }
        }
      }
    } catch (error) {
      console.error('Error checking inventory levels:', error);
    }
  };

  // Check a specific rule's condition against inventory
  const checkRuleCondition = async (rule: PrepWatchRule) => {
    try {
      // Count active inventory items of the specific food type
      const { data: items, error: itemsError } = await supabase
        .from('inventory')
        .select('*')
        .eq('restaurant_id', selectedRestaurant?.id)
        .eq('product', rule.food_type)
        .eq('status', 'active');

      if (itemsError) throw itemsError;
      
      const activeCount = items?.length || 0;
      
      // If count is below minimum, create a notification
      if (activeCount < rule.minimum_count) {
        const newNotification: Notification = {
          id: crypto.randomUUID(),
          title: 'Low Inventory Alert',
          message: `${rule.food_type} count (${activeCount}) is below the minimum requirement of ${rule.minimum_count}`,
          timestamp: new Date(),
          read: false,
          type: 'warning',
          link: '/history'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Also show a toast for immediate attention
        toast.warning(newNotification.title, {
          description: newNotification.message,
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Error checking rule condition:', error);
    }
  };

  // Check inventory levels every minute
  useEffect(() => {
    if (!selectedRestaurant?.id) return;
    
    // Check immediately on load
    checkInventoryLevels();
    
    // Then check every minute
    const intervalId = setInterval(checkInventoryLevels, 60000);
    
    return () => clearInterval(intervalId);
  }, [selectedRestaurant?.id]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
