const dashboardData = {
  user: { name: "Ada" },
  activeProject: {
    title: "Campus Marketplace",
    status: "In Progress",
    role: "Owner · Product Manager",
    hoursPerWeek: 5,
    dates: "19 Oct–30 Nov 2026 · 6 weeks",
    teammates: ["Ada", "David", "John"],
    tasksDone: 2,
    tasksTotal: 6,
    milestones: [
      { name: "Requirements", due: "02 Nov", done: 2, total: 2 },
      { name: "Working prototype", due: "16 Nov", done: 0, total: 3 },
      { name: "Final demo", due: "30 Nov", done: 0, total: 1 },
    ],
  },
  pendingInvitation: {
    title: "Student study planner",
    description: "Help plan a student study tool.",
    role: "Product Manager",
    hoursPerWeek: 4,
    weeks: 4,
  },
  needsAttention: {
    title: "Design onboarding",
    status: ["Blocked", "Overdue 2 days"],
    owner: "David · Designer",
    due: "Due 10 Nov 2026 · Working prototype",
    blockerNote: "Waiting for agreed sign-up fields.",
  },
  upcomingTasks: [
    {
      title: "Prototype review",
      owner: "Ada",
      due: "13 Nov 2026",
      status: "To do",
    },
    {
      title: "UI handoff",
      owner: "David",
      due: "13 Nov 2026",
      status: "In review",
    },
  ],
};

export default dashboardData;
