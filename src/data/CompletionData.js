// Mock data for the Project completion screen (S38/S39).
// Shape follows the saved work the designs show; replace with the backend
// response when the endpoint exists (see services/completionService.js).
const completionData = {
  project: {
    name: "Campus Marketplace",
    status: "In Progress",
    ownerName: "Ada",
    startDate: "2026-10-19",
    endDate: "2026-11-30",
    durationWeeks: 6,
  },
  evidence: {
    outcome:
      "Delivered a responsive marketplace prototype, implemented sign-up and project browsing, and documented the build.",
    deliverable: {
      kind: "file",
      label: "Marketplace prototype",
      name: "marketplace-prototype.zip",
    },
  },
  savedWork: {
    milestones: [
      { id: "M1", name: "Requirements", targetDate: "2026-11-02", done: 2, total: 2 },
      { id: "M2", name: "Working prototype", targetDate: "2026-11-16", done: 3, total: 3 },
      { id: "M3", name: "Final demo", targetDate: "2026-11-30", done: 1, total: 1 },
    ],
  },
  // confirmedBy: the teammate who peer-confirmed this member's contribution
  // wording. awaiting: who still needs to confirm it.
  confirmations: [
    {
      member: "Ada",
      role: "Product manager · Owner",
      summary: "Defined user stories and reviewed the marketplace prototype.",
      doneTasks: 2,
      confirmedBy: "John",
      confirmedOn: "2026-11-30",
      awaiting: null,
    },
    {
      member: "David",
      role: "UI/UX Designer",
      summary: "Designed onboarding and prepared the UI handoff.",
      doneTasks: 2,
      confirmedBy: null,
      confirmedOn: null,
      awaiting: "John",
    },
    {
      member: "John",
      role: "Frontend Developer",
      summary: "Built project browsing and implemented sign-up screens.",
      doneTasks: 2,
      confirmedBy: "Ada",
      confirmedOn: "2026-11-30",
      awaiting: null,
    },
  ],
};

export default completionData;
