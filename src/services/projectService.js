export function saveDraft(draft) {
  void draft;
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("save") === "fail") {
        reject(new Error("Mock draft save failed."));
        return;
      }

      resolve({ id: "mock-draft-1" });
    }, 800);
  });
}
