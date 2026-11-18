import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AvatarGroup from "../../../../components/AvatarGroup";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Skeleton from "../../../../components/Skeleton";
import Textarea from "../../../../components/Textarea";
import teamHealthData from "../../../../data/teamHealthData";
import { postProjectUpdate } from "../../../../services/projectUpdatesService";
import { getProjectHealth } from "../../../../services/teamHealthService";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import shared from "../shared.module.css";
import styles from "./TeamHealth.module.css";

const STATUS_MEANINGS = {
  ON_TRACK: "nothing is wrong.",
  NEEDS_ATTENTION:
    "an overdue task, a blocked task or a missed weekly check-in.",
  AT_RISK:
    "an overdue milestone or a member inactive for more than 14 days.",
};

const STATUS_ICON_TONES = {
  onTrack: "iconOnTrack",
  needsAttention: "iconNeedsAttention",
  atRisk: "iconAtRisk",
};

function splitStatusLabel(label) {
  if (typeof label !== "string") {
    return { icon: "", text: "" };
  }

  const match = label.match(/^([^A-Za-z]*)(.*)$/);

  return {
    icon: match?.[1].trim() ?? "",
    text: match?.[2].trim() ?? "",
  };
}

function isMissingEndpoint(error) {
  return (
    error?.status === 404 &&
    /^Cannot GET\s+/i.test(String(error.message ?? ""))
  );
}

function buildSignalLines(signals) {
  const lines = [];

  if (signals.overdueTasks > 0) {
    lines.push(
      `${signals.overdueTasks} overdue ${
        signals.overdueTasks === 1 ? "task" : "tasks"
      }`,
    );
  }
  if (signals.blockedTasks > 0) {
    lines.push(
      `${signals.blockedTasks} blocked ${
        signals.blockedTasks === 1 ? "task" : "tasks"
      }`,
    );
  }
  if (signals.tasksAwaitingReview > 0) {
    lines.push(
      `${signals.tasksAwaitingReview} ${
        signals.tasksAwaitingReview === 1 ? "task" : "tasks"
      } awaiting review`,
    );
  }
  if (signals.overdueMilestones > 0) {
    lines.push(
      `${signals.overdueMilestones} overdue ${
        signals.overdueMilestones === 1 ? "milestone" : "milestones"
      }`,
    );
  }

  return lines;
}

function TeamHealth() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const asParam = new URLSearchParams(location.search).get("as");

  const {
    project,
    members,
    membersLoading,
    isOwner,
    canManageMembers,
    taskSummary,
    updates,
    updatesLoading,
    updatesError,
    retryUpdates,
    addUpdate,
    workspaceLoading,
    workspaceError,
    retryWorkspace,
  } = useWorkspace();

  const [healthState, setHealthState] = useState({
    projectId: null,
    status: "loading",
    data: null,
    error: "",
    notFound: false,
    missingEndpoint: false,
  });
  const [healthRetry, setHealthRetry] = useState(0);
  const [draftCheckIn, setDraftCheckIn] = useState("");
  const [checkInStatus, setCheckInStatus] = useState("idle");
  const [checkInError, setCheckInError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    getProjectHealth(projectId)
      .then((data) => {
        if (!isCurrent) return;
        setHealthState({
          projectId,
          status: "ready",
          data,
          error: "",
          notFound: false,
          missingEndpoint: false,
        });
      })
      .catch((error) => {
        if (!isCurrent) return;
        setHealthState({
          projectId,
          status: "error",
          data: null,
          error: error.message || teamHealthData.error.message,
          notFound: error.status === 404,
          missingEndpoint: isMissingEndpoint(error),
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, healthRetry]);

  const healthIsCurrent = healthState.projectId === projectId;
  const healthStatus = healthIsCurrent ? healthState.status : "loading";
  const healthNotFound = healthIsCurrent ? healthState.notFound : false;
  const healthMissingEndpoint = healthIsCurrent
    ? healthState.missingEndpoint
    : false;
  const healthError = healthIsCurrent ? healthState.error : "";

  const workspacePath = `/projects/${projectId}/workspace`;
  const workspaceHref = (path) =>
    `${workspacePath}${path}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;
  const releaseHref = (memberId) => {
    const params = new URLSearchParams({ member: String(memberId) });
    if (asParam) params.set("as", asParam);
    return `${workspacePath}/team/release-role?${params.toString()}`;
  };
  const pageTitle = <h2 className={shared.title}>Team health &amp; check-ins</h2>;

  const retryHealth = () => {
    setHealthState({
      projectId,
      status: "loading",
      data: null,
      error: "",
      notFound: false,
      missingEndpoint: false,
    });
    setHealthRetry((count) => count + 1);
  };

  const health = healthIsCurrent ? healthState.data : null;
  const statusLevel = health
    ? teamHealthData.statusLevels.find(
        (level) => level.status === health.status,
      )
    : null;
  const signalLines = health ? buildSignalLines(health.signals) : [];

  const inactiveMembers = [];
  if (health) {
    const seen = new Set();
    health.signals.inactiveMembers.forEach((entry) => {
      let member = null;
      if (entry && typeof entry === "object") {
        const ids = [entry.id, entry.userId, entry.memberId]
          .filter((value) => value != null)
          .map(String);
        member =
          members.find(
            (item) =>
              ids.includes(String(item.id)) ||
              ids.includes(String(item.userId)),
          ) ?? null;
      } else if (entry != null) {
        const key = String(entry);
        member =
          members.find(
            (item) =>
              String(item.id) === key || String(item.userId) === key,
          ) ?? null;
      }

      if (!member) return;
      const key = String(member.id);
      if (seen.has(key)) return;
      seen.add(key);
      inactiveMembers.push(member);
    });
  }

  const handlePostCheckIn = async () => {
    const content = draftCheckIn.trim();
    if (!content || checkInStatus === "posting") return;

    setCheckInStatus("posting");
    setCheckInError("");

    try {
      const update = await postProjectUpdate(projectId, content);
      addUpdate(update);
      setDraftCheckIn("");
      setCheckInStatus("posted");
      setHealthRetry((count) => count + 1);
    } catch (error) {
      setCheckInError(error?.message || "Something went wrong. Try again.");
      setCheckInStatus("error");
    }
  };

  const handleDraftChange = (event) => {
    setDraftCheckIn(event.target.value);
    if (checkInStatus === "posted" || checkInStatus === "error") {
      setCheckInStatus("idle");
    }
  };

  const renderTeamHealthCard = () => (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>{teamHealthData.health.title}</h3>
      <span
        className={`${styles.statusChip} ${
          statusLevel
            ? styles[statusLevel.tone]
            : styles.statusNeutral
        }`}
      >
        {statusLevel ? statusLevel.label : teamHealthData.health.unavailable}
      </span>

      <p className={styles.bodyText}>{teamHealthData.health.description}</p>

      {health.reasons.map((reason, index) => (
        <p className={styles.bodyText} key={`${reason}-${index}`}>
          {reason}
        </p>
      ))}

      {signalLines.map((line) => (
        <p className={styles.bodyText} key={line}>
          {line}
        </p>
      ))}

      <ul className={styles.statusKey}>
        {teamHealthData.statusLevels.map(({ status, label, tone }) => {
          const { icon, text } = splitStatusLabel(label);
          const isCurrent = health.status === status;

          return (
            <li
              key={status}
              className={`${styles.statusKeyLine} ${
                isCurrent ? styles.statusKeyCurrent : ""
              }`}
            >
              <span
                className={`${styles.statusKeyIcon} ${
                  styles[STATUS_ICON_TONES[tone]]
                }`}
              >
                {icon}
              </span>
              <span className={styles.statusKeyText}>
                <strong>{text}</strong>: {STATUS_MEANINGS[status]}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`${styles.helperText} ${styles.statusKeyCaption}`}>
        {teamHealthData.health.helper}
      </p>
    </article>
  );

  const renderSharedProgressCard = () => {
    const progressParts = [];
    if (
      taskSummary &&
      Number.isFinite(taskSummary.total) &&
      Number.isFinite(taskSummary.done)
    ) {
      progressParts.push(`${taskSummary.done} of ${taskSummary.total} tasks Done`);
    }
    if (
      taskSummary &&
      Number.isFinite(taskSummary.overdue) &&
      taskSummary.overdue > 0
    ) {
      progressParts.push(`${taskSummary.overdue} overdue`);
    }

    const avatarItems = members.slice(0, 5).map((member) => ({
      initial: (member.name || "?").charAt(0).toUpperCase(),
      label: member.name || undefined,
    }));
    const memberCount = members.length;
    const memberMeta = `${memberCount} accepted ${
      memberCount === 1 ? "teammate" : "teammates"
    }`;

    return (
      <article className={styles.card}>
        <h3 className={styles.cardTitle}>
          {teamHealthData.sharedProgress.title}
        </h3>
        {progressParts.length > 0 && (
          <p className={styles.summaryStats}>{progressParts.join(" · ")}</p>
        )}
        {project.status && (
          <p className={styles.bodyText}>Project remains {project.status}.</p>
        )}
        {avatarItems.length > 0 && (
          <AvatarGroup
            label={teamHealthData.sharedProgress.teammatesLabel}
            items={avatarItems}
          />
        )}
        <p className={styles.memberMeta}>{memberMeta}</p>
        <Button
          variant="secondary"
          onClick={() => navigate(workspaceHref("/tasks"))}
        >
          View tasks
        </Button>
      </article>
    );
  };

  const renderOwnerPromptCard = () => {
    if (!isOwner || !canManageMembers || inactiveMembers.length === 0) {
      return null;
    }

    const days = health.signals.inactivityDays;
    const description = days
      ? teamHealthData.ownerPrompt.descriptionWithDays.replace(
          "{days}",
          String(days),
        )
      : teamHealthData.ownerPrompt.descriptionInactive;

    return (
      <article className={styles.card}>
        <p className={styles.eyebrow}>{teamHealthData.ownerPrompt.eyebrow}</p>
        <h3 className={styles.cardTitle}>{teamHealthData.ownerPrompt.title}</h3>
        <p className={styles.bodyText}>{description}</p>
        <ul className={styles.memberList}>
          {inactiveMembers.map((member) => (
            <li className={styles.memberRow} key={member.id}>
              <span className={styles.entryAuthor}>
                {member.name || "Teammate"}
              </span>
              <Link className={styles.textLink} to={releaseHref(member.id)}>
                {teamHealthData.ownerPrompt.releaseLabel}
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.helperText}>{teamHealthData.ownerPrompt.helper}</p>
      </article>
    );
  };

  const renderWeeklyCheckInCard = () => (
    <article className={`${styles.card} ${styles.purpleCard}`}>
      <p className={styles.eyebrow}>{teamHealthData.checkIn.eyebrow}</p>
      <h3 className={styles.cardTitle}>{teamHealthData.checkIn.title}</h3>
      <p className={styles.bodyText}>{teamHealthData.checkIn.description}</p>
      <Button onClick={() => navigate(workspaceHref("/updates"))}>
        {teamHealthData.checkIn.openUpdates}
      </Button>
    </article>
  );

  const renderUpdatesCard = () => (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>{teamHealthData.updates.title}</h3>

      {checkInStatus === "posted" && (
        <div className={styles.compactAlert}>
          <Alert variant="success" title={teamHealthData.checkIn.postedTitle}>
            {teamHealthData.checkIn.postedMessage}
          </Alert>
        </div>
      )}

      {checkInStatus === "error" && (
        <div className={styles.compactAlert}>
          <Alert variant="error" title={teamHealthData.checkIn.errorTitle}>
            {checkInError}
          </Alert>
        </div>
      )}

      {updatesLoading && (
        <div className={styles.compactAlert}>
          <Alert variant="info" title="Loading updates…">
            Fetching the latest project updates.
          </Alert>
        </div>
      )}

      {!updatesLoading && updatesError && (
        <div className={styles.compactAlert}>
          <Alert variant="error" title="Couldn't load updates">
            {updatesError}
          </Alert>
          <Button variant="secondary" onClick={retryUpdates}>
            Retry
          </Button>
        </div>
      )}

      {!updatesLoading && !updatesError && updates.length === 0 && (
        <div className={styles.emptyUpdatesBox}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <span className={styles.emptyIconLine} />
            <span className={styles.emptyIconLine} />
            <span className={styles.emptyIconLine} />
          </div>
          <p className={styles.emptyTitle}>{teamHealthData.checkIn.emptyTitle}</p>
          <p className={styles.emptyText}>{teamHealthData.checkIn.emptyText}</p>
          <Button
            onClick={() =>
              document.getElementById("team-health-update")?.focus()
            }
          >
            {teamHealthData.checkIn.emptyButton}
          </Button>
        </div>
      )}

      {!updatesLoading && !updatesError && updates.length > 0 && (
        <div className={styles.threadList}>
          {updates.map((entry, index) => (
            <div
              className={styles.threadEntry}
              key={entry.id ?? `${entry.author}-${entry.date}-${index}`}
            >
              <p className={styles.entryHeader}>
                <strong className={styles.entryAuthor}>{entry.author}</strong>
                {entry.date && (
                  <span className={styles.entryDate}> · {entry.date}</span>
                )}
              </p>
              <p className={styles.entryText}>{entry.message}</p>
            </div>
          ))}
        </div>
      )}

      <Textarea
        id="team-health-update"
        label={teamHealthData.checkIn.textareaLabel}
        value={draftCheckIn}
        onChange={handleDraftChange}
        maxLength={5000}
        disabled={checkInStatus === "posting"}
        helperText={`Posts to ${project.name || "this project"} → Updates. Visible to your accepted team.`}
      />
      <Button
        onClick={handlePostCheckIn}
        disabled={!draftCheckIn.trim() || checkInStatus === "posting"}
        loading={checkInStatus === "posting"}
        loadingText={teamHealthData.checkIn.posting}
      >
        {teamHealthData.checkIn.post}
      </Button>
    </article>
  );

  if (workspaceError) {
    return (
      <section className={styles.page}>
        {pageTitle}
        <StateNotice
          variant="error"
          title={teamHealthData.error.title}
          text={workspaceError}
          buttonLabel="Retry"
          onButtonClick={retryWorkspace}
        />
      </section>
    );
  }

  if (healthStatus === "loading" || workspaceLoading || membersLoading) {
    return (
      <section className={styles.page} aria-live="polite">
        {pageTitle}
        <div className={styles.loadingWrap}>
          <div className={styles.compactAlert}>
            <Alert variant="info" title={teamHealthData.loading.title}>
              {teamHealthData.loading.description}
            </Alert>
          </div>
          <p className={styles.loadingHelper}>{teamHealthData.loading.helper}</p>
          <div className={styles.loadingCards}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        </div>
      </section>
    );
  }

  if (healthStatus === "error") {
    const errorTitle = healthMissingEndpoint
      ? teamHealthData.endpointMissing.title
      : healthNotFound
        ? teamHealthData.notFound.title
        : teamHealthData.error.title;
    const errorFallback = healthMissingEndpoint
      ? teamHealthData.endpointMissing.message
      : healthNotFound
        ? teamHealthData.notFound.message
        : teamHealthData.error.message;

    return (
      <section className={styles.page}>
        {pageTitle}
        <StateNotice
          variant={healthNotFound && !healthMissingEndpoint ? "info" : "error"}
          title={errorTitle}
          text={healthError || errorFallback}
          buttonLabel="Retry"
          onButtonClick={retryHealth}
        />
      </section>
    );
  }

  return (
    <section className={styles.page}>
      {pageTitle}
      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          {renderTeamHealthCard()}
          {renderSharedProgressCard()}
          {renderOwnerPromptCard()}
        </div>
        <div className={styles.rightColumn}>
          {renderWeeklyCheckInCard()}
          {renderUpdatesCard()}
        </div>
      </div>
    </section>
  );
}

export default TeamHealth;
