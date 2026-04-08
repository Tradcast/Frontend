"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface NotificationContextType {
  notifications: string[];
  notificationsRead: boolean;
  setNotificationsFromApi: (notifs: string[], read: boolean) => void;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DUMMY_NOTIFICATION = "Welcome to Tradcast! Start playing to earn TPOINT rewards.";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<string[]>([DUMMY_NOTIFICATION]);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const setNotificationsFromApi = useCallback((notifs: string[], read: boolean) => {
    const combined = notifs.length > 0 ? notifs : [DUMMY_NOTIFICATION];
    setNotifications(combined.slice(0, 6));
    setNotificationsRead(read);
  }, []);

  const markAsRead = useCallback(() => {
    setNotificationsRead(true);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, notificationsRead, setNotificationsFromApi, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
