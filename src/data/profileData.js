export const VISIBILITY_FIELDS = [
  { key: "name", label: "Show name publicly", short: "name" },
  { key: "role", label: "Show professional role publicly", short: "role" },
  { key: "skills", label: "Show skills publicly", short: "skills" },
  { key: "skillLevel", label: "Show skill level publicly", short: "level" },
  { key: "goals", label: "Show goals publicly", short: "goals" },
  { key: "availability", label: "Show weekly availability publicly", short: "availability" },
  { key: "duration", label: "Show preferred project duration publicly", short: "duration" },
];

// Proposed default: everything private, pending PM confirmation.
export const NO_VISIBILITY = {
  name: false,
  role: false,
  skills: false,
  skillLevel: false,
  goals: false,
  availability: false,
  duration: false,
  showProject: false,
};
