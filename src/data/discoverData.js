// Mock data for the Discover Projects screen (same style as dashboardData.js).
// Replace with backend data when the endpoints are confirmed.

// The user's self-reported availability (from their profile).
export const availabilityProfile = {
  name: "David",
  role: "UI/UX Designer",
  skills: ["UI design", "Prototyping"],
  hoursPerWeek: 6,
  weeks: 6,
};

const toOptions = (values) => values.map((value) => ({ value, label: value }));

// The five optional filters. "summaryLabel" is the short label used in the
// mobile summary ("Type: Web application").
export const filterFields = [
  {
    key: "skill",
    label: "Skill",
    summaryLabel: "Skill",
    placeholder: "Any skill",
    options: toOptions([
      "UI design",
      "Prototyping",
      "Frontend development",
      "Backend development",
      "Product management",
    ]),
  },
  {
    key: "role",
    label: "Role",
    summaryLabel: "Role",
    placeholder: "Any role",
    options: toOptions([
      "UI/UX Designer",
      "Frontend Developer",
      "Backend Developer",
      "Product Manager",
    ]),
  },
  {
    key: "type",
    label: "Project type",
    summaryLabel: "Type",
    placeholder: "Any project type",
    options: toOptions(["Web application", "Mobile app"]),
  },
  {
    key: "duration",
    label: "Duration",
    summaryLabel: "Duration",
    placeholder: "Any duration",
    options: [4, 6, 8].map((weeks) => ({
      value: String(weeks),
      label: `${weeks} weeks`,
    })),
  },
  {
    key: "hours",
    label: "Weekly hours",
    summaryLabel: "Weekly hours",
    placeholder: "Any weekly hours",
    options: [4, 6, 8].map((hours) => ({
      value: String(hours),
      label: `${hours} h / week`,
    })),
  },
];

export const emptyFilters = {
  skill: "",
  role: "",
  type: "",
  duration: "",
  hours: "",
};

export const openProjects = [
  {
    id: "campus-marketplace",
    title: "Campus Marketplace",
    description:
      "Students struggle to exchange campus items across scattered group chats.",
    role: "UI/UX Designer",
    skills: ["UI design", "Prototyping"],
    hoursPerWeek: 6,
    weeks: 6,
    type: "Web application",
    dates: "19 Oct–30 Nov 2026",
  },
  {
    id: "campus-resource-directory",
    title: "Campus resource directory",
    description:
      "Design a clear directory so students can browse campus services and find useful resources.",
    role: "UI/UX Designer",
    skills: ["UI design", "Prototyping"],
    hoursPerWeek: 6,
    weeks: 6,
    type: "Web application",
    dates: "19 Oct–30 Nov 2026",
  },
  {
    id: "study-group-finder",
    title: "Study group finder",
    description: "Match students into study groups by course and schedule.",
    role: "UI/UX Designer",
    skills: ["UI design"],
    hoursPerWeek: 4,
    weeks: 4,
    type: "Mobile app",
    dates: "2–29 Nov 2026",
  },
  {
    // Not eligible for the profile above, so it never appears in results.
    id: "library-seat-tracker",
    title: "Library seat tracker",
    description: "Show which library seats are free in real time.",
    role: "Backend Developer",
    skills: ["Backend development"],
    hoursPerWeek: 8,
    weeks: 8,
    type: "Web application",
    dates: "9 Nov 2026–3 Jan 2027",
  },
];