// TODO: replace with a real api.put(...) call once the backend has a
// visibility endpoint. Until then this mock waits, then succeeds or fails.
export function saveVisibility(values, { simulateFail = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (simulateFail) {
        reject(new Error("Visibility did not save"));
      } else {
        resolve(values);
      }
    }, 900);
  });
}
