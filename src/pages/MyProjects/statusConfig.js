const STATUSES = [
  "Draft",
  "Open",
  "Team Formed",
  "In Progress",
  "Completed",
  "Ended Early",
];

export const STATUS_OPTIONS = STATUSES.map((status) => ({
  value: status,
  label: status,
}));

// Badge colour, button label and where the button goes, per exact status.
export const statusConfig = {
  Draft: {
    tone: "neutral",
    actionLabel: "Resume draft",
    path: (id) => `/projects/${id}/edit`,
  },
  Open: {
    tone: "purple",
    actionLabel: "View project page",
    path: (id) => `/projects/${id}`,
  },
  "Team Formed": {
    tone: "neutral",
    actionLabel: "Open joined workspace",
    path: (id) => `/projects/${id}/workspace`,
  },
  "In Progress": {
    tone: "neutral",
    actionLabel: "Open project workspace",
    path: (id) => `/projects/${id}/workspace`,
  },
  Completed: {
    tone: "green",
    actionLabel: "View private project page",
    path: (id) => `/projects/${id}/page`,
  },
  "Ended Early": {
    tone: "neutral",
    actionLabel: "View preserved record",
    path: (id) => `/projects/${id}/page`,
  },
};

export const defaultStatusConfig = {
  tone: "neutral",
  actionLabel: "View project page",
  path: (id) => `/projects/${id}`,
};