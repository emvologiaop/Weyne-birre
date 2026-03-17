export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const showNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/vite.svg", // Using the default icon
    });
  }
};
