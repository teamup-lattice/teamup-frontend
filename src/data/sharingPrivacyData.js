// Mock data for the Sharing and privacy screen
const sharingPrivacyData = {
  user: { name: "Ada" },
  project: {
    id: 1,
    title: "Campus Marketplace",
    status: "Completed",
    completedOn: "30 Nov 2026",
    dates: "19 Oct–30 Nov · 6 weeks",
    summary:
      "Delivered a responsive marketplace prototype, implemented sign-up and project browsing, and documented the build.",
    team: [
      { name: "Ada", role: "Product manager / Owner" },
      { name: "David", role: "UI/UX Designer" },
      { name: "John", role: "Frontend Developer" },
    ],
  },
  sharing: {
    savedVisibility: "Team-only",
  },
  profile: {
    displayOnProfile: false,
  },
};

export default sharingPrivacyData;