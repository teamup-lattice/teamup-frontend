import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import { releaseRole } from "../../../../services/workspaceService";
import { useSimulate } from "../../useSimulate";
import { useWorkspace } from "../../useWorkspace";
import { SEP, formatDate, numberWord, shortDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./ReleaseRole.module.css";

const APOS = "\u2019";

function listText(items) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function ReleaseRole() {
  const { project, members, tasks, isOwner } = useWorkspace();
  const { projectId, memberName } = useParams();
  const [params] = useSearchParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();

  const [status, setStatus] = useState("idle"); // idle | releasing | error | released
  const errorRef = useRef(null);

  const wanted = (memberName ?? params.get("member") ?? "David").toLowerCase();
  const member = members.find((m) => m.name.toLowerCase() === wanted) ?? members[1];
  const roleShort = member.role.split(" ").pop();
  const openTasks = tasks.filter((t) => t.assignee === member.name && t.status !== "Done");
  const taskNames = listText(openTasks.map((t) => t.title));

  const teamPath = `/projects/${projectId}/workspace/team${search}`;
  const tasksPath = `/projects/${projectId}/workspace/tasks${search}`;
  const alreadyOpen = simulate === "open";

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  async function handleRelease() {
    setStatus("releasing");
    try {
      await releaseRole({ member: member.name }, { simulateFail: simulate === "fail" });
      setStatus("released");
    } catch {
      setStatus("error");
    }
  }

  const header = (
    <>
      <h2 className={shared.title}>Release role</h2>
      <p className={shared.description}>
        Team / {member.name}
        {SEP}Role release review
      </p>
    </>
  );

  if (!isOwner) {
    return (
      <div>
        {header}
        <Alert variant="info" title="Only the Owner can release a role">
          Ask {project.ownerName}, the Owner, if a role needs to be released.
        </Alert>
        <Button variant="secondary" onClick={() => navigate(teamPath)}>
          Back to team
        </Button>
      </div>
    );
  }

  if (alreadyOpen) {
    return (
      <div>
        {header}
        <Alert variant="info" title="No filled role to release">
          {roleShort} role already Open. Review task ownership separately.
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
        <Alert variant="success" title={`${roleShort} role is now Open`}>
          {`Project remains ${project.status}. ${member.name}${APOS}s ${numberWord(openTasks.length)} open tasks, history, comments and completed work remain unchanged.`}
        </Alert>
        <section className={shared.card}>
          <h3 className={shared.cardTitle}>Owner{APOS}s next step</h3>
          <p className={shared.text}>
            Review {taskNames} individually. A role release does not select a
            replacement or save a handover.
          </p>
          <div className={shared.stack}>
            <Button fullWidth variant="secondary" onClick={() => navigate(tasksPath)}>
              Review manual reassignment
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate(tasksPath)}>
              Review task ownership
            </Button>
          </div>
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
          <Alert variant="info" title="Releasing role...">
            {`Saving release. ${member.name}${APOS}s role unchanged until confirmed; confirmation temporarily locked.`}
          </Alert>
          <div className={shared.skeleton} />
        </>
      )}
      {status === "error" && (
        <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
          <Alert variant="error" title={`${member.name}${APOS}s role was not released`}>
            {`${member.role} remains filled by ${member.name}. ${
              openTasks.length > 1 ? "Both open tasks" : "The open task"
            } still belong to ${member.name}. Your choice is retained.`}
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
          {member.hoursPerWeek} h / week{SEP}Accepted {formatDate(member.acceptedDate)}
        </p>
        <p className={styles.strong}>Open work still assigned to {member.name}</p>
        <ul className={shared.list}>
          {openTasks.map((task) => (
            <li key={task.id} className={shared.text}>
              {task.title}
              {SEP}
              {task.status}
              {SEP}Due {shortDate(task.dueDate)}
            </li>
          ))}
        </ul>
        <p className={shared.helper}>
          Comments, history and completed work will be preserved. No task will be
          automatically reassigned.
        </p>
      </section>

      <section className={styles.confirm} aria-labelledby="confirm-title">
        <h3 id="confirm-title" className={shared.cardTitle}>
          {`Release ${member.name}${APOS}s ${roleShort} role?`}
        </h3>
        <p className={shared.text}>
          {`${member.role} reopens. Project stays ${project.status}. ${taskNames} remain assigned to ${member.name} until the Owner reassigns them.`}
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate(teamPath)} disabled={isReleasing}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRelease}
            loading={isReleasing}
            loadingText="Releasing..."
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
