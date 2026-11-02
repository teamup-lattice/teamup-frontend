export const workspaceProject = {
  name: "Campus Marketplace",
  status: "In Progress",
  startDate: "2026-10-19",
  endDate: "2026-11-30",
  durationWeeks: 6,
  ownerName: "Ada",
};

export const members = [
  {
    name: "Ada",
    role: "Owner / Product manager",
    hoursPerWeek: 5,
    status: "Accepted",
    acceptedDate: "2026-10-19",
    durationWeeks: 6,
    commitmentType: "Self-reported",
  },
  {
    name: "David",
    role: "UI/UX Designer",
    hoursPerWeek: 6,
    status: "Accepted",
    acceptedDate: "2026-10-19",
    durationWeeks: 6,
    commitmentType: "Self-reported",
  },
  {
    name: "John",
    role: "Frontend Developer",
    hoursPerWeek: 8,
    status: "Accepted",
    acceptedDate: "2026-10-19",
    durationWeeks: 6,
    commitmentType: "Self-reported",
  },
];

export const milestones = [
  {
    id: "M1",
    name: "Requirements",
    targetDate: "2026-11-02",
    completedTasks: 2,
    totalTasks: 2,
    status: "Done",
  },
  {
    id: "M2",
    name: "Working prototype",
    targetDate: "2026-11-16",
    completedTasks: 0,
    totalTasks: 3,
    status: "To do",
  },
  {
    id: "M3",
    name: "Final demo",
    targetDate: "2026-11-30",
    completedTasks: 0,
    totalTasks: 1,
    status: "To do",
  },
];

export const tasks = [
  {
    id: "task-1",
    title: "Define user stories",
    assignee: "Ada",
    dueDate: "2026-11-02",
    milestoneId: "M1",
    status: "Done",
    note: "User stories agreed.",
  },
  {
    id: "task-2",
    title: "Build discovery",
    assignee: "John",
    dueDate: "2026-11-10",
    milestoneId: "M1",
    status: "Done",
    note: "Discovery build complete.",
  },
  {
    id: "task-3",
    title: "Design onboarding",
    assignee: "David",
    dueDate: "2026-11-10",
    milestoneId: "M2",
    status: "Blocked",
    overdueDays: 2,
    blockerNote: "Waiting for agreed sign-up fields.",
  },
  {
    id: "task-4",
    title: "Auth screens",
    assignee: "John",
    dueDate: "2026-11-14",
    milestoneId: "M2",
    status: "In progress",
    note: "Auth implementation underway.",
  },
  {
    id: "task-5",
    title: "UI handoff",
    assignee: "David",
    dueDate: "2026-11-13",
    milestoneId: "M2",
    status: "In review",
    note: "UI handoff ready for review.",
  },
  {
    id: "task-6",
    title: "Prototype review",
    assignee: "Ada",
    dueDate: "2026-11-13",
    milestoneId: "M3",
    status: "To do",
    note: "Review to prepare.",
  },
];

export const statuses = [
  "To do",
  "In progress",
  "In review",
  "Done",
  "Blocked",
];

export const taskComments = [
  {
    taskId: "task-3",
    author: "Ada",
    date: "2026-11-12",
    message:
      "I'll help agree the sign-up fields today. Keep the blocker note until that is resolved.",
  },
];

export const projectUpdates = [
  {
    author: "David",
    date: "2026-11-12",
    message: "Waiting for agreed sign-up fields.",
  },
  {
    author: "Ada",
    date: "2026-11-12",
    message: "I'll help agree the fields today.",
  },
];

export function getTaskById(taskId) {
  return tasks.find((task) => task.id === taskId);
}

export function getMemberByName(name) {
  return members.find((member) => member.name === name);
}
