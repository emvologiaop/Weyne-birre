// Notification service — handles permission, local notifications, and 6-hour reminders
// Uses the Page Visibility API to fire reminders smartly (not while user is active)

let reminderInterval: ReturnType<typeof setInterval> | null = null;
type NotificationOptionsWithRenotify = NotificationOptions & { renotify?: boolean };

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const isNotificationGranted = (): boolean =>
  'Notification' in window && Notification.permission === 'granted';

export const showNotification = (title: string, body: string, options?: NotificationOptionsWithRenotify) => {
  if (!isNotificationGranted()) return;
  try {
    // Prefer service worker notifications (work when tab is backgrounded)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: '/manifest-icon-192.maskable.png',
        badge: '/manifest-icon-192.maskable.png',
        ...options,
      });
    } else {
      new Notification(title, {
        body,
        icon: '/manifest-icon-192.maskable.png',
        badge: '/manifest-icon-192.maskable.png',
        ...options,
      });
    }
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};

const SIX_HOURS = 6 * 60 * 60 * 1000;
const REMINDER_KEY = 'weyne_last_reminder';

export const startReminderSchedule = () => {
  if (reminderInterval) return; // already running

  const fireIfDue = () => {
    if (!isNotificationGranted()) return;
    // Don't fire if the page is visible (user is actively using the app)
    if (document.visibilityState === 'visible') return;

    const last = parseInt(localStorage.getItem(REMINDER_KEY) || '0', 10);
    const now = Date.now();
    if (now - last >= SIX_HOURS) {
      localStorage.setItem(REMINDER_KEY, String(now));
      showNotification('ወይኔ ብሬ — Time to check in', "Don't forget to log today's expenses!");
    }
  };

  // Check every 30 minutes; actual firing only happens when 6h have passed AND tab is hidden
  reminderInterval = setInterval(fireIfDue, 30 * 60 * 1000);

  // Also try once when the app loads (catches cases after long absence)
  setTimeout(fireIfDue, 5000);
};

export const stopReminderSchedule = () => {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
};

export const showBudgetAlert = (categoryName: string, percentage: number) => {
  showNotification(
    `⚠️ Budget Alert: ${categoryName}`,
    `You've used ${percentage}% of your ${categoryName} budget this month.`,
    { tag: `budget-${categoryName}`, renotify: true }
  );
};

export const showAchievementUnlock = (name: string, description: string) => {
  showNotification(`🏆 Achievement Unlocked: ${name}`, description, {
    tag: `achievement-${name}`,
  });
};
