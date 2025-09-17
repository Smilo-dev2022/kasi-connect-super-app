export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export const Notifications = {
  async requestPermission(): Promise<boolean> {
    // Placeholder: integrate FCM/APNs later
    return true;
  },
  async showLocal(_payload: NotificationPayload): Promise<void> {
    // Placeholder: wire native local notifications in future
  },
};

