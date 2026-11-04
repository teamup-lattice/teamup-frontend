// Mock data for the Project details screen (same style as dashboardData.js).
// Replace with backend data when the endpoint is confirmed.
// Only "campus-marketplace" exists; any other id shows "Project not found".

// The signed-in user's self-reported availability (from their profile).
export const availabilityProfile = {
  name: "David",
  skills: ["UI design", "Prototyping"],
  hoursPerWeek: 6,
  weeks: 6,
};

export const projectDetailsById = {
  "campus-marketplace": {
    id: "campus-marketplace",
    title: "Campus Marketplace",
    type: "Web application",
    recruitmentStatus: "Open for recruitment",
    problem:
      "Students struggle to exchange campus items across scattered group chats.",
    description:
      "Build a responsive campus marketplace prototype with listings, item details and sign-up. Collaborate on requirements, UI design and frontend implementation.",
    expectedOutcome:
      "A responsive marketplace prototype with sign-up, item browsing and a documented build.",
    skills: ["UI design", "Frontend development", "Product planning"],
    owner: { name: "Ada", role: "Product Manager", hoursPerWeek: 5 },
    plannedTeamSize: 3,
    collaboratorsJoined: 0,
    milestones: [
      { label: "Requirements", date: "02 Nov 2026" },
      { label: "Working prototype", date: "16 Nov 2026" },
      { label: "Final demo", date: "30 Nov 2026" },
    ],
    agreements: [
      "Respond within the agreed response window.",
      "Keep task status up to date when it changes.",
      "Tell the team early when unavailable or a deadline is at risk.",
      "Raise blockers early so the team can help.",
    ],
    responseWindowProposal:
      "Agree a response window before starting. Suggested: weekday evenings.",
    roles: [
      {
        id: "ui-ux-designer",
        title: "UI/UX Designer",
        shortName: "UI/UX",
        summary:
          "Design onboarding, prototype the sign-up flow and provide a UI handoff.",
        skills: ["UI design", "Prototyping"],
        expectedContribution:
          "Onboarding designs, a sign-up prototype and a UI handoff.",
        hoursPerWeek: 6,
        weeks: 6,
        start: "19 Oct 2026",
        end: "30 Nov 2026",
        availability: "Weekday evenings; Saturday afternoon",
        taskDeadlines: [
          { label: "Design onboarding", date: "10 Nov 2026" },
          { label: "UI handoff", date: "13 Nov 2026" },
        ],
      },
      {
        // Only the summary, skills and hours come from the design; the rest
        // of this role is placeholder text.
        id: "frontend-developer",
        title: "Frontend Developer",
        shortName: "Frontend",
        summary: "Implement authentication screens and marketplace discovery.",
        skills: ["Frontend development", "React"],
        expectedContribution:
          "Authentication screens and marketplace discovery pages.",
        hoursPerWeek: 8,
        weeks: 6,
        start: "19 Oct 2026",
        end: "30 Nov 2026",
        availability: "Weekday evenings; Saturday afternoon",
        taskDeadlines: [
          { label: "Authentication screens", date: "10 Nov 2026" },
          { label: "Marketplace discovery", date: "16 Nov 2026" },
        ],
      },
    ],
  },
};