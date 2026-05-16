// src/components/layout/NotificationCenter.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  isRead: boolean;
  createdAt: string;
  deepLink?: string;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/employee/notifications");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "goal_submitted": return "📝";
      case "goal_approved": return "✅";
      case "goal_rejected": return "❌";
      case "checkin_reminder": return "⏰";
      case "sheet_unlocked": return "🔓";
      default: return "📢";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>
        }
      />
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    !notification.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getCategoryIcon(notification.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
