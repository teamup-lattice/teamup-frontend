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

const LEGACY_PROJECT_TYPE_VALUES = {
  "web application": "WEB_APPLICATION",
  "mobile app": "MOBILE_APP",
  "desktop app": "DESKTOP_APP",
  "api service": "API_SERVICE",
  "data science": "DATA_SCIENCE",
  design: "DESIGN",
  other: "OTHER",
};

const DURATION_VALUES = new Set(["4", "6", "8"]);
const HOURS_VALUES = new Set(["4", "6", "8"]);

export const projectTypeOptions = [
  { value: "WEB_APPLICATION", label: "Web application" },
  { value: "MOBILE_APP", label: "Mobile app" },
  { value: "DESKTOP_APP", label: "Desktop app" },
  { value: "API_SERVICE", label: "API service" },
  { value: "DATA_SCIENCE", label: "Data science" },
  { value: "DESIGN", label: "Design" },
  { value: "OTHER", label: "Other" },
];

export function normalizeProjectTypeValue(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();
  const enumValue = trimmed.toUpperCase();
  if (projectTypeOptions.some((option) => option.value === enumValue)) {
    return enumValue;
  }
  return LEGACY_PROJECT_TYPE_VALUES[trimmed.toLowerCase()] ?? "";
}

const roleOptions = [
  { value: "Frontend", label: "Frontend" },
  { value: "Backend", label: "Backend" },
  { value: "Designer", label: "Designer" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "QA", label: "QA" },
  { value: "Data", label: "Data" },
  { value: "Marketing", label: "Marketing" },
];

const ROLE_VALUES = new Set(roleOptions.map((option) => option.value));

// The optional filters. "summaryLabel" is the short label used in the
// mobile summary ("Type: Web application").
export const filterFields = [
  {
    key: "skill",
    label: "Skill",
    summaryLabel: "Skill",
    placeholder: "Any skill",
    options: [],
    dynamic: "skills",
  },
  {
    key: "role",
    label: "Role",
    summaryLabel: "Role",
    placeholder: "Any role",
    options: roleOptions,
  },
  {
    key: "type",
    label: "Project type",
    summaryLabel: "Type",
    placeholder: "Any project type",
    options: projectTypeOptions,
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

export function buildFilterFields(skillOptions = []) {
  return filterFields.map((field) =>
    field.dynamic === "skills" ? { ...field, options: skillOptions } : field,
  );
}

export const emptyFilters = {
  skill: "",
  role: "",
  type: "",
  duration: "",
  hours: "",
};

export function normalizeFilters(filters = {}, { skillIds = null } = {}) {
  const raw = filters ?? {};
  const next = { ...emptyFilters };

  const skill = raw.skill === null || raw.skill === undefined ? "" : String(raw.skill);
  if (skill) {
    if (skillIds instanceof Set) {
      if (skillIds.has(skill)) next.skill = skill;
    } else {
      next.skill = skill;
    }
  }

  const role =
    typeof raw.role === "string" ? raw.role.trim() : "";
  if (ROLE_VALUES.has(role)) next.role = role;

  next.type = normalizeProjectTypeValue(raw.type);

  const duration =
    raw.duration === null || raw.duration === undefined
      ? ""
      : String(raw.duration);
  if (DURATION_VALUES.has(duration)) next.duration = duration;

  const hours =
    raw.hours === null || raw.hours === undefined ? "" : String(raw.hours);
  if (HOURS_VALUES.has(hours)) next.hours = hours;

  return next;
}

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