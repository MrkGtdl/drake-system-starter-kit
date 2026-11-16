"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationResponse = {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  error?: string;
};

type NotificationBellProps = {
  canUpdate: boolean;
  canDelete: boolean;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function NotificationBell({
  canUpdate,
  canDelete,
}: NotificationBellProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/notifications");
      const result: NotificationResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load notifications");
      }

      setNotifications(result.data);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Unable to mark notification as read");
    }
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (notification.id && !notification.readAt && canUpdate) {
      try {
        setActiveNotificationId(notification.id);
        await markAsRead(notification.id);
        await fetchNotifications();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to update notification",
        );
        return;
      } finally {
        setActiveNotificationId(null);
      }
    }

    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setIsUpdating(true);
      setError("");

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update notifications");
      }

      await fetchNotifications();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update notifications",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setActiveNotificationId(id);
      setError("");

      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete notification");
      }

      await fetchNotifications();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete notification",
      );
    } finally {
      setActiveNotificationId(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative inline-flex size-10 items-center justify-center rounded-md border transition-colors hover:bg-muted"
      >
        <Bell size={19} strokeWidth={1.8} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            </div>

            <div className="flex items-center gap-1">
              {canUpdate && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={isUpdating}
                  title="Mark all as read"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCheck size={17} />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="border-b bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {error}
              <button
                type="button"
                onClick={fetchNotifications}
                className="ml-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 size={17} className="animate-spin" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell
                  size={25}
                  className="mx-auto mb-3 text-muted-foreground"
                />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You don&apos;t have any notifications yet.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id || notification.createdAt}
                  className={`group flex gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50 ${
                    !notification.readAt ? "bg-muted/30" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      notification.readAt ? "bg-transparent" : "bg-primary"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    disabled={activeNotificationId === notification.id}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-sm font-medium">{notification.title}</p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {notification.message}
                    </p>

                    <span className="mt-2 block text-[11px] text-muted-foreground">
                      {formatDate(notification.createdAt)}
                      {notification.link && (
                        <ExternalLink size={11} className="ml-1 inline" />
                      )}
                    </span>
                  </button>

                  {activeNotificationId === notification.id ? (
                    <Loader2
                      size={15}
                      className="mt-1 shrink-0 animate-spin text-muted-foreground"
                    />
                  ) : (
                    <div className="flex shrink-0 items-start gap-1">
                      {canUpdate && !notification.readAt && (
                        <button
                          type="button"
                          title="Mark as read"
                          aria-label="Mark as read"
                          onClick={() => handleNotificationClick(notification)}
                          className="rounded p-1.5 text-muted-foreground opacity-100 transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <CheckCheck size={15} />
                        </button>
                      )}

                      {canDelete && notification.id && (
                        <button
                          type="button"
                          title="Delete notification"
                          aria-label="Delete notification"
                          onClick={() => handleDelete(notification.id)}
                          className="rounded p-1.5 text-muted-foreground opacity-100 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t px-4 py-2">
            <button
              type="button"
              onClick={fetchNotifications}
              className="w-full py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Refresh notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
