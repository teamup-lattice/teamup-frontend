// Contribution summary + Teammate confirmation data.
//
// The backend has no contribution endpoints yet, so the saved wording and the
// teammate confirmation live in memory below (they reset on a full page
// reload). Everything else, the member, their Done tasks and the team, comes
// from the real workspace data (members + tasks) that the screens pass in.
//
// TODO: when the backend is ready, replace the three exported functions with
// api calls, for example:
//   api.get(`/api/projects/${projectId}/contributions/${memberId}`)
//   api.put(`/api/projects/${projectId}/contributions/me`)
//   api.post(`/api/projects/${projectId}/contributions/${memberId}/confirm`)
// The screens only use the return shapes documented on each function.
//
// Preview states (dev only, via the page URL):
//   ?simulate=loadfail     the screen fails to load
//   ?simulate=empty        the member has no saved Done tasks
//   ?simulate=fail         the first save / confirm attempt fails, the next works
//   ?simulate=reviewed     (own screen) wording already saved, awaiting a teammate
//   ?simulate=confirmed    teammate already confirmed the wording
//   ?simulate=notreviewed  (teammate screen) the member has not reviewed yet
//   ?simulate=reviewed     (teammate screen) the member already saved their wording
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const store = new Map(); // `${projectId}:${memberId}` -> saved review

const keyOf = (projectId, memberId) => `${projectId}:${memberId}`;
const today = () => new Date().toISOString().slice(0, 10);

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// First draft of the wording, built from the member's Done task titles.
function draftSummary(tasks) {
  if (tasks.length === 0) return "";
  const titles = tasks.map((task) => task.title).filter(Boolean);
  const noun = tasks.length === 1 ? "task" : "tasks";
  return truncate(`Completed ${tasks.length} ${noun}: ${titles.join(", ")}`, 140);
}

// The teammate who confirms a member's wording: the next member in the list
// (the last member is confirmed by the first). TEMPORARY rule until the
// backend assigns reviewers.
export function pickReviewer(members, memberId) {
  if (members.length < 2) return null;
  const index = members.findIndex((item) => item.id === memberId);
  return members[(index + 1) % members.length];
}

// input = {
//   member:  { id, name, role }
//   members: [{ id, name, role }]      every project member
//   tasks:   [task]                    this member's Done tasks (mapTask shape)
//   ownerName: string
// }
// returns {
//   memberId, member, role, summary, note, tasks,
//   reviewedOn, confirmedBy, confirmedById, confirmedOn,
//   reviewer, reviewerId,              who confirms (reviewer is a name)
//   team: { confirmedOthers, total, ownerName }
// }
export async function getContribution(projectId, input, { variant = null } = {}) {
  await wait(400);
  if (variant === "loadfail") throw new Error("Request failed");

  const { member, members, ownerName } = input;
  const tasks = variant === "empty" ? [] : input.tasks;
  const saved = store.get(keyOf(projectId, member.id)) ?? {};
  const reviewer = pickReviewer(members, member.id);

  let { reviewedOn = null, confirmedBy = null, confirmedById = null, confirmedOn = null } = saved;
  if (variant === "reviewed") reviewedOn = reviewedOn ?? today();
  if (variant === "notreviewed") {
    reviewedOn = null;
    confirmedBy = null;
    confirmedById = null;
    confirmedOn = null;
  }
  if (variant === "confirmed") {
    reviewedOn = reviewedOn ?? today();
    confirmedBy = confirmedBy ?? reviewer?.name ?? "A teammate";
    confirmedById = confirmedById ?? reviewer?.id ?? null;
    confirmedOn = confirmedOn ?? today();
  }

  const confirmedOthers = members.filter(
    (item) => item.id !== member.id && store.get(keyOf(projectId, item.id))?.confirmedBy,
  ).length;

  return {
    memberId: member.id,
    member: member.name,
    role: member.role,
    summary: saved.summary ?? draftSummary(tasks),
    note: saved.note ?? "",
    tasks,
    reviewedOn,
    confirmedBy,
    confirmedById,
    confirmedOn,
    reviewer: reviewer?.name ?? "a teammate",
    reviewerId: reviewer?.id ?? null,
    team: { confirmedOthers, total: members.length, ownerName },
  };
}

// Saves the member's own wording and marks it Reviewed.
// returns { summary, note, reviewedOn }
export async function saveOwnReview(projectId, memberId, review, { simulateFail = false } = {}) {
  await wait(1000);
  if (simulateFail) throw new Error("Request failed");
  const key = keyOf(projectId, memberId);
  const next = {
    ...store.get(key),
    summary: review.summary,
    note: review.note,
    reviewedOn: today(),
  };
  store.set(key, next);
  return { summary: next.summary, note: next.note, reviewedOn: next.reviewedOn };
}

// A teammate confirms the member's contribution wording (not impact).
// returns { confirmedBy, confirmedById, confirmedOn }
export async function confirmContribution(
  projectId,
  memberId,
  confirmer,
  { simulateFail = false } = {},
) {
  await wait(1000);
  if (simulateFail) throw new Error("Request failed");
  const key = keyOf(projectId, memberId);
  const next = {
    ...store.get(key),
    confirmedBy: confirmer.name,
    confirmedById: confirmer.id,
    confirmedOn: today(),
  };
  store.set(key, next);
  return {
    confirmedBy: next.confirmedBy,
    confirmedById: next.confirmedById,
    confirmedOn: next.confirmedOn,
  };
}
