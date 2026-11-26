import { getProjectContributions } from "./contributionsService";

function toDateOnly(value) {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? ""
    : new Date(timestamp).toISOString().slice(0, 10);
}

function submittedTime(contribution) {
  const value = contribution.submittedAt || contribution.createdAt;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function latestReview(contribution, decision) {
  const reviews = Array.isArray(contribution?.reviews)
    ? contribution.reviews
    : [];
  return (
    reviews
      .filter((review) => review.decision === decision)
      .sort((a, b) => {
        const aTime = Date.parse(a.createdAt);
        const bTime = Date.parse(b.createdAt);
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      })[0] ?? null
  );
}

function doneTaskCount(tasks, member) {
  return tasks.filter((task) => {
    if (String(task.status).toLowerCase() !== "done") return false;
    const byMemberId =
      task.assigneeMemberId &&
      String(task.assigneeMemberId) === String(member.id);
    const byUserId =
      member.userId &&
      task.assigneeUserId &&
      String(task.assigneeUserId) === String(member.userId);
    return (
      byMemberId ||
      byUserId ||
      (!task.assigneeMemberId && task.assignee === member.name)
    );
  }).length;
}

function buildConfirmations(members, contributions, tasks) {
  return members.map((member) => {
    const memberContributions = contributions
      .filter((item) => String(item.member.userId) === String(member.userId))
      .sort((a, b) => submittedTime(b) - submittedTime(a));
    const confirmed =
      memberContributions.find((item) => item.status === "CONFIRMED") ?? null;
    const shown = confirmed ?? memberContributions[0] ?? null;
    const review = confirmed ? latestReview(confirmed, "CONFIRMED") : null;

    return {
      member: member.name,
      userId: member.userId,
      user: { id: member.userId, name: member.name },
      role: member.role,
      summary: shown?.title ?? "",
      doneTasks: doneTaskCount(tasks, member),
      hasContribution: memberContributions.length > 0,
      confirmedBy: confirmed
        ? review?.reviewer?.name || "A teammate"
        : null,
      confirmedOn: confirmed ? toDateOnly(confirmed.confirmedAt) : null,
      awaiting: confirmed ? null : "a teammate",
    };
  });
}

export async function getCompletion(
  projectId,
  { variant = null, members = [], tasks = [] } = {},
) {
  if (variant === "loadfail") throw new Error("Request failed");
  const contributions = await getProjectContributions(projectId);
  return { confirmations: buildConfirmations(members, contributions, tasks) };
}
