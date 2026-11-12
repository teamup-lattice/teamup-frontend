import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import { releaseWorkspaceMember } from "../../../../services/workspaceMembersService";
import { useWorkspace } from "../../useWorkspace";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./ReleaseRole.module.css";

function ReleaseRole() {
  const {
    project,
    members,
    canManageMembers,
    workspaceLoading,
    workspaceError,
    membersLoading,
    membersError,
    retryWorkspace,
    refreshMembers,
  } = useWorkspace();
  const { projectId } = useParams();
  const [params] = useSearchParams();
  const { search } = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle");
  const [actionError, setActionError] = useState("");
  const [releaseMessage, setReleaseMessage] = useState("");
  const [roleReopened, setRoleReopened] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [releasedMember, setReleasedMember] = useState(null);
  const errorRef = useRef(null);

  const requestedMemberId = params.get("member");
  const member =
    members.find((item) => String(item.id) === requestedMemberId) ?? null;
  const memberIsOwner =
    member?.accessLevel === "OWNER" ||
    (member && project.ownerId != null &&
      String(member.userId) === String(project.ownerId));
  const roleShort = member?.role.split(" ").filter(Boolean).pop() || "role";

  const teamPath = `/projects/${projectId}/workspace/team${search}`;
  const tasksPath = `/projects/${projectId}/workspace/tasks${search}`;

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  async function handleRelease() {
    if (!member || status === "releasing") return;
    setStatus("releasing");
    setActionError("");
    setRefreshError("");
    try {
      const response = await releaseWorkspaceMember(projectId, member.id);
      setReleasedMember(member);
      setReleaseMessage(response.message || "The member role was released.");
      setRoleReopened(response.roleReopened);
      setStatus("released");
      try {
        await refreshMembers();
      } catch (error) {
        setRefreshError(error.message || "Members could not be refreshed.");
      }
    } catch (error) {
      setActionError(error.message || "The member role could not be released.");
      setStatus("error");
    }
  }

  if (status !== "released" && (workspaceLoading || membersLoading)) {
    return (
      <div>
        <h2 className={shared.title}>Release role</h2>
        <p role="status">Loading member details…</p>
        <div className={shared.skeleton} />
      </div>
    );
  }

  if (status !== "released" && (workspaceError || membersError)) {
    return (
      <div>
        <h2 className={shared.title}>Release role</h2>
        <Alert variant="error" title="Couldn't load member details">
          {workspaceError || membersError}
        </Alert>
        <Button variant="secondary" onClick={retryWorkspace}>
          Retry
        </Button>
      </div>
    );
  }

  const displayedMember = status === "released" ? releasedMember : member;
  if (!displayedMember) {
    return (
      <div>
        <h2 className={shared.title}>Release role</h2>
        <Alert variant="error" title="Member not found">
          This member is no longer active in the project.
        </Alert>
        <Button variant="secondary" onClick={() => navigate(teamPath)}>
          Back to team
        </Button>
      </div>
    );
  }

  const header = (
    <>
      <h2 className={shared.title}>Release role</h2>
      <p className={shared.description}>
        Team / {displayedMember.name}
        {SEP}Role release review
      </p>
    </>
  );

  if (!canManageMembers || memberIsOwner) {
    return (
      <div>
        {header}
        <Alert variant="info" title="Only an owner or manager can release a member">
          {memberIsOwner
            ? "The project owner cannot be released."
            : `Ask ${project.ownerName || "the project owner"} or a manager if a role needs to be released.`}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(teamPath)}>
          Back to team
        </Button>
      </div>
    );
  }

  if (status === "released") {
    return (
      <div>
        {header}
        <Alert variant="success" title="Member role released">
          {releaseMessage}
        </Alert>
        {refreshError && (
          <Alert variant="error" title="Couldn't refresh team members">
            {refreshError}
          </Alert>
        )}
        <section className={shared.card}>
          <h3 className={shared.cardTitle}>
            {roleReopened ? "Role reopened" : "Release completed"}
          </h3>
          <p className={shared.text}>
            {displayedMember.name}&apos;s active tasks were unassigned by the
            server and were not deleted.
          </p>
          <Button fullWidth variant="secondary" onClick={() => navigate(tasksPath)}>
            Review tasks
          </Button>
        </section>
      </div>
    );
  }

  const isReleasing = status === "releasing";

  return (
    <div>
      {header}

      {isReleasing && (
        <>
          <Alert variant="info" title="Releasing role…">
            The server is releasing the member and unassigning their active tasks.
          </Alert>
          <div className={shared.skeleton} />
        </>
      )}
      {status === "error" && (
        <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
          <Alert variant="error" title="Member role was not released">
            {actionError}
          </Alert>
        </div>
      )}

      <section className={shared.card} aria-labelledby="member-summary">
        <h3 id="member-summary" className={shared.cardTitle}>
          {member.name}
          {SEP}
          {member.role}
        </h3>
        <p className={shared.text}>
          {member.accessLevel || "Access level not provided"}
          {member.acceptedDate && `${SEP}Joined ${member.acceptedDate}`}
          {member.hoursPerWeek != null && `${SEP}${member.hoursPerWeek} h / week`}
        </p>
        <p className={styles.strong}>
          {member.openTaskCount == null
            ? "Open task count unavailable"
            : `${member.openTaskCount} open ${member.openTaskCount === 1 ? "task" : "tasks"}`}
        </p>
        <p className={shared.helper}>
          Active tasks will be unassigned, not deleted. Comments, history and
          completed work are preserved.
        </p>
      </section>

      <section className={styles.confirm} aria-labelledby="confirm-title">
        <h3 id="confirm-title" className={shared.cardTitle}>
          {`Release ${member.name}'s ${roleShort} role?`}
        </h3>
        <p className={shared.text}>
          {`${member.role} reopens. Project stays ${project.status}. The server will unassign active tasks without deleting them.`}
        </p>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => navigate(teamPath)}
            disabled={isReleasing}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRelease}
            loading={isReleasing}
            loadingText="Releasing…"
          >
            {status === "error" ? "Retry release" : "Release role"}
          </Button>
        </div>
      </section>
      <p className={shared.helper}>Cancel leaves the role and tasks unchanged.</p>
    </div>
  );
}

export default ReleaseRole;
