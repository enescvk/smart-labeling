
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { toast } from 'sonner';
import { PrepWatchRule } from '@/components/admin/PrepWatchTab';
import { getActiveInventoryItems } from '@/services/inventory/queries';

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
  const [lastCheck, setLastCheck] = useState<Record<string, Date>>({});
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
      
      console.log('Checking PrepWatch rules:', rules);

      // For each rule, check active inventory counts
      for (const rule of rules as PrepWatchRule[]) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const ruleHour = rule.check_hour;
        const ruleMinute = rule.check_minute;
        
        console.log(`Checking rule for ${rule.food_type}: current time ${currentHour}:${currentMinute}, rule time ${ruleHour}:${ruleMinute}`);

        // Create a unique key for this rule to track last check time
        const ruleKey = `${rule.id}-${rule.food_type}`;
        const lastCheckTime = lastCheck[ruleKey];
        const today = new Date().setHours(0, 0, 0, 0);
        
        // Check if we should verify this rule now
        const shouldCheck = (
          // Current time matches or just passed the rule time
          (currentHour === ruleHour && currentMinute >= ruleMinute) &&
          // And we haven't checked it today or it's been more than 23 hours since last check
          (!lastCheckTime || 
           new Date(lastCheckTime).setHours(0, 0, 0, 0) !== today || 
           (now.getTime() - lastCheckTime.getTime()) > 23 * 60 * 60 * 1000)
        );
        
        if (shouldCheck) {
          console.log(`Time to check rule for ${rule.food_type}`);
          await checkRuleCondition(rule);
          
          // Update last check time for this rule
          setLastCheck(prev => ({
            ...prev,
            [ruleKey]: new Date()
          }));
        }
      }
    } catch (error) {
      console.error('Error checking inventory levels:', error);
    }
  };

  // Check a specific rule's condition against inventory
  const checkRuleCondition = async (rule: PrepWatchRule) => {
    try {
      console.log(`Checking condition for rule: ${rule.food_type}, min: ${rule.minimum_count}`);
      
      // Get active inventory items directly using the inventory service
      const items = await getActiveInventoryItems(selectedRestaurant?.id);
      
      // Filter items by the specific food type
      const matchingItems = items.filter(item => 
        item.product.toLowerCase() === rule.food_type.toLowerCase()
      );
      
      const activeCount = matchingItems.length;
      console.log(`Found ${activeCount} active ${rule.food_type} items, minimum required: ${rule.minimum_count}`);
      
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
        
        console.log('Created notification for low inventory');
      }
    } catch (error) {
      console.error('Error checking rule condition:', error);
    }
  };

  // Run an initial check when the component mounts or restaurant changes
  useEffect(() => {
    if (selectedRestaurant?.id) {
      checkInventoryLevels();
    }
  }, [selectedRestaurant?.id]);

  // Check inventory levels every minute
  useEffect(() => {
    if (!selectedRestaurant?.id) return;
    
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
