import notificationsData from "../data/notificationsData";

// Mock service. Preview states with a URL flag:
//   ?notifications=empty   no notifications
//   ?notifications=fail    the refresh fails (shows the last saved list)
//   ?markread=fail         "Mark all as read" fails
// When the real API exists, only this file changes.

function getPreviewFlag(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function mockRequest(produce, delay) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(produce());
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

let allRead = false;

function currentItems() {
  return notificationsData.items.map((item) => ({
    ...item,
    read: allRead || item.read,
  }));
}

// The last list that loaded successfully. Seeded with the mock list so the
// "couldn't refresh" design can be previewed on a first load; with a real API
// this starts empty and is set from each successful response.
let lastSaved = currentItems();

export function getNotifications() {
  return mockRequest(() => {
    if (getPreviewFlag("notifications") === "fail") {
      throw new Error("Mock notifications refresh failed.");
    }
    lastSaved = getPreviewFlag("notifications") === "empty" ? [] : currentItems();
    return lastSaved;
  }, 600);
}

export function getLastSavedNotifications() {
  return lastSaved;
}

export function markAllNotificationsRead() {
  return mockRequest(() => {
    if (getPreviewFlag("markread") === "fail") {
      throw new Error("Mock mark-all-as-read failed.");
    }
    allRead = true;
  }, 700);
}
