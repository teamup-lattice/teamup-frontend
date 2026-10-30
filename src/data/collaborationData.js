export const project = {
  name: "Campus Marketplace",
  status: "Open",
  type: "Web application",
  ownerName: "Ada",
  ownerRole: "Product Manager",
  ownerHours: "5 h / week",
  problem:
    "Students struggle to exchange campus items across scattered group chats.",
  description:
    "Build a responsive campus marketplace prototype with listings, item details and sign-up. Collaborate on requirements, UI design and frontend implementation.",
  expectedOutcome:
    "A responsive marketplace prototype with sign-up, item browsing and a documented build.",
  skills: ["UI design", "Frontend development", "Product planning"],
  startDate: "2026-10-19",
  endDate: "2026-11-30",
  milestones: [
    { name: "Requirements", date: "2026-11-02" },
    { name: "Working prototype", date: "2026-11-16" },
    { name: "Final demo", date: "2026-11-30" },
  ],
};

export const roles = {
  uiux: {
    title: "UI/UX Designer",
    responsibilities:
      "Design onboarding, prototype the sign-up flow and provide a UI handoff.",
    requiredSkills: ["UI design", "Prototyping"],
    expectedContribution:
      "Onboarding designs, a sign-up prototype and a UI handoff.",
    hours: 6,
    weeks: 6,
    availability: "Weekday evenings; Saturday afternoon",
    taskDeadlines: [
      { name: "Design onboarding", date: "2026-11-10" },
      { name: "UI handoff", date: "2026-11-13" },
    ],
  },
  frontend: {
    title: "Frontend Developer",
    responsibilities:
      "Implement authentication screens and marketplace discovery.",
    requiredSkills: ["Frontend development", "React"],
    expectedContribution:
      "Responsive authentication screens and marketplace discovery, with a documented build.",
    hours: 8,
    weeks: 6,
    availability: "Weekday evenings; Saturday afternoon",
    taskDeadlines: [{ name: "Auth screens", date: "2026-11-15" }],
  },
};

export const people = {
  david: {
    name: "David",
    roleKey: "uiux",
    skills: ["UI design", "Prototyping"],
    level: "Beginner",
    hours: 6,
    weeks: 6,
    goal: "Practice translating requirements into clear interface flows.",
  },
  john: {
    name: "John",
    roleKey: "frontend",
    skills: ["Frontend development", "React"],
    hours: 8,
    weeks: 6,
    goal: "Build responsive interfaces and practice working in a small team.",
  },
};

export const invitation = {
  to: "david",
  receivedOn: "2026-10-18",
  roleKey: "uiux",
};

export const joinRequest = {
  from: "john",
  receivedOn: "2026-10-18",
  roleKey: "frontend",
};

export const teamAgreements = {
  bullets: [
    "Respond within the agreed response window.",
    "Keep task status up to date when it changes.",
    "Tell the team early when unavailable or a deadline is at risk.",
    "Raise blockers early so the team can help.",
  ],
  proposal: "Agree a response window before starting. Suggested: weekday evenings.",
  note: "Response window: to be agreed.",
  commitmentText:
    "To be agreed before starting; suggested: weekday evenings.",
};
