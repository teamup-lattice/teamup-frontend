import myProjectsData from "../data/myProjectsData";

const CACHE_KEY = "teamup_my_projects_cache";

function cacheRecords(records) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(records));
  } catch {
    // Storage can be unavailable; the cache is only a convenience.
  }
}

// Last saved records, shown when a refresh fails.
export function getCachedProjectRecords() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

// Mock service, same pattern as profileService and projectService.
// Add ?load=fail to the page URL to see the load-failure state.
// "Retry refresh" then succeeds, so you can see the success message too.
export function getMyProjectRecords({ isRetry = false } = {}) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const shouldFail =
        !isRetry &&
        new URLSearchParams(window.location.search).get("load") === "fail";

      if (shouldFail) {
        reject(new Error("Mock project records load failed."));
        return;
      }

      cacheRecords(myProjectsData);
      resolve(myProjectsData);
    }, 800);
  });
}