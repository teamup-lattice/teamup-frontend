import { getProjectById } from "./projectService";
import { getWorkspaceMembers } from "./workspaceMembersService";
import { getProjectEvidence } from "./evidenceService";
import { getContributionSummary } from "./contributionsService";
import { getProjectMilestones } from "./milestonesService";
import { getAllProjectTasks } from "./tasksService";
import {
  getSharingPrivacy,
  saveProfileDisplay,
} from "./sharingPrivacyService";

// Preview states (dev only, via the page URL):
//   ?simulate=fail          the page fails to load
//   ?simulate=notcompleted  the project is not Completed yet
//   ?simulate=profilefail   "Save own profile choice" fails

function toDateInput(value) {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? ""
    : new Date(timestamp).toISOString().slice(0, 10);
}

function readableStatus(value) {
  if (typeof value !== "string") return "";
  const words = value.toLowerCase().split("_");
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

function buildMemberships(project) {
  return (Array.isArray(project.memberships) ? project.memberships : [])
    .filter(
      (membership) =>
        membership &&
        (typeof membership.id === "string" ||
          typeof membership.id === "number"),
    )
    .map((membership) => ({
      id: membership.id,
      userId: membership.userId ?? membership.user?.id ?? "",
      name:
        typeof membership.user?.name === "string" ? membership.user.name : "",
      role:
        typeof membership.role === "string"
          ? membership.role
          : typeof membership.role?.title === "string"
            ? membership.role.title
            : "",
    }));
}

function tasksForMember(tasks, member) {
  return tasks.filter((task) => {
    if (String(task.status).toLowerCase() !== "done") return false;
    const byUserId =
      member.userId &&
      task.assigneeUserId &&
      String(task.assigneeUserId) === String(member.userId);
    return byUserId || (!task.assigneeMemberId && task.assignee === member.name);
  });
}

function latestPerMember(contributions) {
  const byMember = new Map();
  contributions.forEach((item) => {
    const key = String(item.member.userId || item.member.name);
    const current = byMember.get(key);
    const itemTime = Date.parse(item.confirmedAt);
    const currentTime = Date.parse(current?.confirmedAt);
    if (
      !current ||
      (Number.isNaN(currentTime) ? 0 : currentTime) <=
        (Number.isNaN(itemTime) ? 0 : itemTime)
    ) {
      byMember.set(key, item);
    }
  });
  return [...byMember.values()];
}

export async function getPrivateProjectPage(projectId, { variant = null } = {}) {
  if (variant === "fail") throw new Error("Request failed");

  const [projectResponse, members, deliverables, contributions, sharing] =
    await Promise.all([
      getProjectById(projectId),
      getWorkspaceMembers(projectId),
      getProjectEvidence(projectId),
      getContributionSummary(projectId),
      getSharingPrivacy(projectId),
    ]);

  const project = projectResponse?.project;
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    throw new Error("Project response is missing project data.");
  }

  const status = readableStatus(project.status);
  const memberships = buildMemberships(project);
  const milestones = await getProjectMilestones(projectId);
  const taskResult = await getAllProjectTasks(
    projectId,
    {},
    { memberships, milestones },
  );

  return {
    project: {
      name: typeof project.title === "string" ? project.title : "",
      status: variant === "notcompleted" ? "In Progress" : status,
      visibility: "PRIVATE",
      audience: "Team-only",
      startDate: toDateInput(project.startDate),
      endDate: toDateInput(project.targetEndDate),
      completedOn: toDateInput(project.completedAt),
      durationWeeks:
        typeof project.durationWeeks === "number" ? project.durationWeeks : 0,
      overview: typeof project.description === "string" ? project.description : "",
      problem: typeof project.problem === "string" ? project.problem : "",
      outcome:
        typeof project.completionOutcome === "string"
          ? project.completionOutcome
          : "",
    },
    team: {
      joinedOn: toDateInput(project.startDate),
      members: members.map((member) => ({
        name: member.name,
        role: member.role,
      })),
    },
    deliverables: deliverables.map((item) => ({
      kind: item.kind,
      name: item.name,
      url: item.url,
    })),
    contributions: latestPerMember(contributions).map((item) => ({
      member: item.member.name,
      role: item.member.role,
      summary: item.title,
      note: item.description,
      // GAP: the backend allows more than one confirmed contribution per member;
      // this keeps the newest one to match the design's one summary per member.
      tasks: tasksForMember(taskResult.tasks, item.member).map((task) => ({
        id: task.id,
        title: task.title,
        owner: task.assignee,
        dueDate: task.dueDate,
        milestone: task.milestoneName,
        // GAP: the task list has no completion timestamp or evidence fields.
        completedOn: "",
        evidence: null,
      })),
    })),
    sharing: {
      savedVisibility: project.isShared ? "Shared" : "Team-only",
      displayOnProfile: sharing.profile.displayOnProfile,
    },
  };
}

export function saveOwnProfileChoice(displayOnProfile, { simulateFail = false } = {}) {
  if (simulateFail) {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("Request failed")), 800);
    });
  }
  return saveProfileDisplay(displayOnProfile);
}
