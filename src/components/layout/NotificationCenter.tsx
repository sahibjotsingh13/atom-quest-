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
      case "goal_locked": return "🔒";
      case "goal_unlocked":
      case "sheet_unlocked": return "🔓";
      case "checkin_reminder": return "⏰";
      case "checkin_submitted": return "📥";
      case "checkin_approved":
      case "checkin_acknowledged": return "👍";
      case "checkin_feedback": return "💬";
      default: return "📢";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button className="relative p-2 text-slate-400 hover:text-[#ff7043] hover:bg-white/5 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ff7043] rounded-full ring-2 ring-[#050a0f] animate-pulse" />
            )}
          </button>
        }
      />
      <PopoverContent className="w-96 p-0 bg-[#0a1118]/95 border border-white/10 text-[#ede8e4] backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden" align="end">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#050a0f]/50">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-[#ffab91] hover:text-white hover:bg-white/5"
            >
              {markAllRead.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1 text-[#ff7043]" />
              )}
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-[#ff7043] animate-spin" />
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-[#ff7043]/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{getCategoryIcon(notification.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.isRead ? "text-[#ffab91]" : "text-[#ede8e4]"}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-[#ff7043] rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
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

