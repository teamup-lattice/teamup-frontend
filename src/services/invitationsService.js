import { api } from "./api";
import { getProjectById } from "./projectService";

const PAGE_LIMIT = 20;

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readableLabel(value) {
  const label = String(value ?? "")
    .replaceAll("_", " ")
    .toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function mapProject(project, role, invitation) {
  const mappedRole = role
    ? {
        id: role.id,
        title: role.title ?? "",
        responsibilities: role.description ?? "",
        requiredSkills: (Array.isArray(role.skills) ? role.skills : [])
          .map((item) => item?.skill?.name)
          .filter(Boolean),
        expectedContribution: "",
        hours:
          invitation.proposedHoursPerWeek ??
          role.hoursPerWeek ??
          null,
        weeks: project.durationWeeks ?? null,
        availability: project.availabilityExpectation ?? "",
        taskDeadlines: [],
      }
    : null;

  return {
    id: project.id,
    name: project.title ?? "",
    type: readableLabel(project.projectType),
    status:
      project.status === "OPEN"
        ? "Open for recruitment"
        : readableLabel(project.status),
    problem: project.problem ?? "",
    description: project.description ?? "",
    expectedOutcome: project.outcome ?? "",
    skills: (Array.isArray(project.skills) ? project.skills : [])
      .map((item) => item?.skill?.name)
      .filter(Boolean),
    ownerName: project.owner?.name ?? "",
    ownerRole: "",
    ownerHours: "",
    durationWeeks: project.durationWeeks ?? null,
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.targetEndDate),
    teamSize: project.teamSize ?? null,
    availabilityExpectation: project.availabilityExpectation ?? "",
    availabilityResponseExpectation:
      project.availabilityResponseExpectation ?? "",
    milestones: (Array.isArray(project.milestones) ? project.milestones : [])
      .map((milestone) => ({
        id: milestone.id,
        name: milestone.title ?? "",
        date: formatDate(milestone.dueDate),
        status: milestone.status ?? "",
      })),
    role: mappedRole,
  };
}

function mapInvitation(invitation, project) {
  const mappedProject = mapProject(project, invitation.role, invitation);

  return {
    id: invitation.id,
    status: invitation.status,
    message: invitation.message ?? "",
    inviterName: invitation.inviter?.name ?? "",
    receivedOn: formatDate(invitation.createdAt),
    expiresOn: formatDate(invitation.expiresAt),
    role: mappedProject.role,
    project: mappedProject,
    responseExpectation: project.availabilityResponseExpectation ?? "",
  };
}

export async function getInvitationById(id) {
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await api.get(
      `/api/invitations?status=PENDING&page=${page}&limit=${PAGE_LIMIT}`,
    );
    const invitations = Array.isArray(response?.invitations)
      ? response.invitations
      : [];
    const invitation = invitations.find(
      (item) => String(item.id) === String(id),
    );
    totalPages = response?.pagination?.totalPages ?? page;

    if (invitation) {
      const projectResponse = await getProjectById(invitation.project.id);
      if (!projectResponse?.project) {
        throw new Error("Project response is missing project data.");
      }
      const projectRole = projectResponse.project.roles?.find(
        (role) => String(role.id) === String(invitation.role.id),
      );
      return mapInvitation(
        {
          ...invitation,
          role: { ...projectRole, ...invitation.role },
        },
        projectResponse.project,
      );
    }

    page += 1;
  }

  return null;
}

export const acceptInvitation = (id) =>
  api.post(`/api/invitations/${encodeURIComponent(id)}/accept`);

export const declineInvitation = (id) =>
  api.post(`/api/invitations/${encodeURIComponent(id)}/decline`);
