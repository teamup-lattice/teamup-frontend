import sharingPrivacyData from "../data/sharingPrivacyData";

// Mock for now. Later: api.get("/api/...") like dashboardService.js
export const getSharingPrivacy = () => Promise.resolve(sharingPrivacyData);

// Mock save with a short delay so the "Saving..." state shows.
// Later: api.put("/api/...", { displayOnProfile })
export const saveProfileDisplay = (displayOnProfile) =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ displayOnProfile }), 800);
  });