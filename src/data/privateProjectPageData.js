// Mock data for the Private project page (completed project, team-only).
// Task ids match data/workspaceData.js so "View task evidence" opens the
// existing task detail route. File urls are placeholders; a real backend
// returns signed file urls. Links use example.org as in the designs.
const privateProjectPageData = {
  project: {
    name: "Campus Marketplace",
    status: "Completed",
    visibility: "PRIVATE",
    audience: "Team-only",
    startDate: "2026-10-19",
    endDate: "2026-11-30",
    completedOn: "2026-11-30",
    durationWeeks: 6,
    overview:
      "A responsive marketplace prototype covering sign-up and browsing for campus item exchange.",
    problem: "Students need a clear way to browse and exchange used campus items.",
    outcome:
      "Delivered a responsive marketplace prototype, implemented sign-up and project browsing, and documented the build.",
  },
  team: {
    joinedOn: "2026-10-19",
    members: [
      { name: "Ada", role: "Product manager · Owner" },
      { name: "David", role: "UI/UX Designer" },
      { name: "John", role: "Frontend Developer" },
    ],
  },
  deliverables: [
    { kind: "file", name: "marketplace-prototype.zip", url: "#" },
  ],
  contributions: [
    {
      member: "Ada",
      role: "Product manager · Owner",
      summary: "Defined user stories and reviewed the marketplace prototype.",
      note: "Own reviewed contribution wording.",
      tasks: [
        {
          id: "task-1",
          title: "Define user stories",
          owner: "Ada",
          dueDate: "2026-11-02",
          milestone: "M1 Requirements",
          completedOn: "2026-11-02",
          evidence: { kind: "file", name: "user-stories.pdf", url: "#" },
        },
        {
          id: "task-6",
          title: "Prototype review",
          owner: "Ada",
          dueDate: "2026-11-13",
          milestone: "M3 Final demo",
          completedOn: "2026-11-30",
          evidence: { kind: "file", name: "prototype-review.pdf", url: "#" },
        },
      ],
    },
    {
      member: "David",
      role: "UI/UX Designer",
      summary: "Designed onboarding and prepared the UI handoff.",
      note: "Documented the final sign-up fields and shared handoff context with John.",
      tasks: [
        {
          id: "task-3",
          title: "Design onboarding",
          owner: "David",
          dueDate: "2026-11-10",
          milestone: "M2 Working prototype",
          completedOn: "2026-11-16",
          evidence: { kind: "file", name: "onboarding-design.pdf", url: "#" },
        },
        {
          id: "task-5",
          title: "UI handoff",
          owner: "David",
          dueDate: "2026-11-13",
          milestone: "M2 Working prototype",
          completedOn: "2026-11-16",
          evidence: { kind: "file", name: "ui-handoff.pdf", url: "#" },
        },
      ],
    },
    {
      member: "John",
      role: "Frontend Developer",
      summary: "Built project browsing and implemented sign-up screens.",
      note: "Own reviewed contribution wording.",
      tasks: [
        {
          id: "task-2",
          title: "Build discovery",
          owner: "John",
          dueDate: "2026-11-10",
          milestone: "M1 Requirements",
          completedOn: "2026-11-10",
          evidence: {
            kind: "link",
            name: "example.org/discovery",
            url: "https://example.org/discovery",
          },
        },
        {
          id: "task-4",
          title: "Auth screens",
          owner: "John",
          dueDate: "2026-11-14",
          milestone: "M2 Working prototype",
          completedOn: "2026-11-16",
          evidence: {
            kind: "link",
            name: "example.org/auth",
            url: "https://example.org/auth",
          },
        },
      ],
    },
  ],
};

export default privateProjectPageData;
