
import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationsContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const [open, setOpen] = useState(false);

  // Handle click on a notification
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <p>No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 p-4 border-b hover:bg-muted/50 transition-colors",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  {notification.link ? (
                    <Link
                      to={notification.link}
                      onClick={() => handleNotificationClick(notification.id)}
                      className="flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{notification.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                        >
                          ×
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{notification.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => dismissNotification(notification.id)}
                        >
                          ×
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
