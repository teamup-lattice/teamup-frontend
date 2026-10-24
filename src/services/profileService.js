export function saveProfile(profile) {
  void profile;
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("save") === "fail") {
        reject(new Error("Mock profile save failed."));
        return;
      }

      resolve();
    }, 800);
  });
}
