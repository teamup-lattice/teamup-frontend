import settingsData from "../data/settingsData";

// Mock service until the Settings API exists.
// Preview states in the browser: ?settings=empty, ?settings=fail, ?save=fail, ?deletion=fail

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

export function getSettings() {
  return mockRequest(() => {
    if (getPreviewFlag("settings") === "fail") {
      throw new Error("Mock settings load failed.");
    }

    return getPreviewFlag("settings") === "empty"
      ? settingsData.defaults
      : settingsData.saved;
  }, 600);
}

export function saveSettings(settings) {
  void settings;
  return mockRequest(() => {
    if (getPreviewFlag("save") === "fail") {
      throw new Error("Mock settings save failed.");
    }
  }, 800);
}

export function requestAccountDeletion() {
  return mockRequest(() => {
    if (getPreviewFlag("deletion") === "fail") {
      throw new Error("Mock deletion request failed.");
    }
  }, 800);
}
