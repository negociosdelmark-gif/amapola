export async function requestNotificationPermission() {
  console.log("Notification permission requested (mock).");
  return "granted";
}

export function onMessageListener() {
  return new Promise((resolve) => {
    resolve({ notification: { title: "Test Notification", body: "This is a test notification." } });
  });
}
