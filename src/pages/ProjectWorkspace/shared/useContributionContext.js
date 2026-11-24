import { useCallback, useMemo } from "react";
import { useWorkspace } from "../useWorkspace";

const asText = (value) => (value === undefined || value === null ? "" : String(value));

// The ONE place the contribution screens read the workspace context
// (useWorkspace). If a field is named differently in ProjectWorkspace.jsx,
// fix it here and nothing else needs to change.
//
//   members  [{ id, userId, name, role }]
//   me       the signed-in member (matched by user id, then by name)
//   tasks    every project task (mapTask shape)
//   doneTasksOf(member)  that member's Done tasks
export function useContributionContext() {
  const workspace = useWorkspace();
  const { currentUser, project } = workspace;

  const rawMembers = workspace.members;
  const rawTasks = workspace.tasks;
  const loading = Boolean(
    workspace.workspaceLoading ||
      workspace.membersLoading ||
      workspace.tasksLoading ||
      workspace.isLoading,
  );

  const members = useMemo(
    () =>
      (Array.isArray(rawMembers) ? rawMembers : []).map((item) => ({
        id: asText(item.id ?? item.memberId ?? item.userId ?? item.name),
        userId: asText(item.userId ?? item.user?.id),
        name: item.name ?? item.user?.name ?? "Member",
        role: item.role ?? "",
        user: {
          id: asText(item.userId ?? item.user?.id),
          name: item.name ?? item.user?.name ?? "Member",
        },
      })),
    [rawMembers],
  );

  const tasks = useMemo(() => (Array.isArray(rawTasks) ? rawTasks : []), [rawTasks]);

  const me = useMemo(() => {
    const userId = asText(currentUser?.id ?? currentUser?.userId);
    const found = members.find(
      (item) => (userId && item.userId === userId) || item.name === currentUser?.name,
    );
    return (
      found ?? {
        id: userId || asText(currentUser?.name),
        userId,
        name: currentUser?.name ?? "You",
        role: currentUser?.role ?? "",
      }
    );
  }, [members, currentUser]);

  const ownerName = useMemo(
    () =>
      project?.ownerName ??
      project?.owner?.name ??
      members.find((item) => /owner/i.test(item.role))?.name ??
      "The project owner",
    [project, members],
  );

  const doneTasksOf = useCallback(
    (member) =>
      tasks.filter((task) => {
        if (String(task.status).toLowerCase() !== "done") return false;
        const byMemberId = asText(task.assigneeMemberId) === member.id;
        const byUserId = member.userId && asText(task.assigneeUserId) === member.userId;
        return byMemberId || byUserId || (!task.assigneeMemberId && task.assignee === member.name);
      }),
    [tasks],
  );

  return {
    loading,
    members,
    tasks,
    me,
    ownerName,
    doneTasksOf,
    isOwner: workspace.isOwner,
    canManageMembers: workspace.canManageMembers,
  };
}
