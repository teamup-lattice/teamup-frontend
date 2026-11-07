import sharingPrivacyData from "../data/sharingPrivacyData";

// Mock for now. Later this becomes: api.get("/api/...") like dashboardService.js
export const getSharingPrivacy = () => Promise.resolve(sharingPrivacyData);