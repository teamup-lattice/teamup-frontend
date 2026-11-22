import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Skeleton from "../../../../components/Skeleton";
import { saveOwnReview } from "../../../../services/contributionsService";
import DoneTaskList from "../../shared/DoneTaskList";
import { useContribution } from "../../shared/useContribution";
import { useContributionContext } from "../../shared/useContributionContext";
import { useSimulate } from "../../useSimulate";
import { SEP, formatDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import ReviewCard from "./ReviewCard";
import styles from "./ContributionSummary.module.css";

const LOAD_VARIANTS = ["loadfail", "empty", "reviewed", "confirmed"];

// "My contribution summary": a member reviews the wording of their own
// contribution (built from their saved Done tasks) and saves it as Reviewed.
// A teammate then confirms it on the Teammate confirmation screen.
function ContributionSummary() {
  const { loading, members, me, ownerName, doneTasksOf } = useContributionContext();
  const { projectId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();
  const variant = LOAD_VARIANTS.includes(simulate) ? simulate : null;

  const input = useMemo(
    () =>
      loading
        ? null
        : {
            member: me,
            members: members.length > 0 ? members : [me],
            tasks: doneTasksOf(me),
            ownerName,
          },
    [loading, me, members, doneTasksOf, ownerName],
  );

  const { isLoading, data, error, retry, update } = useContribution({
    projectId,
    input,
    variant,
  });

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | error
  const [justSaved, setJustSaved] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  // In dev, ?simulate=fail makes the FIRST save fail so the retry path can be
  // tried; the next attempt succeeds. A state initialiser keeps it per visit.
  const [failNextSave, setFailNextSave] = useState(simulate === "fail");

  const workspacePath = `/projects/${projectId}/workspace`;
  const completionPath = `${workspacePath}/completion${search}`;

  async function handleSave(review) {
    setSaveStatus("saving");
    setJustSaved(false);
    const shouldFail = failNextSave;
    setFailNextSave(false);
    try {
      const saved = await saveOwnReview(projectId, me.id, review, { simulateFail: shouldFail });
      update(saved);
      setFormVersion((version) => version + 1);
      setSaveStatus("idle");
      setJustSaved(true);
    } catch (saveError) {
      console.error("Failed to save own review:", saveError);
      setSaveStatus("error");
    }
  }

  if (isLoading) {
    return (
      <div>
        <h2 className={shared.title}>My contribution summary</h2>
        <p role="status">Loading your contribution summary…</p>
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h2 className={shared.title}>My contribution summary</h2>
        <Alert variant="error" title="Couldn't load your contribution summary">
          {error || "Something went wrong. Try again."}
        </Alert>
        <Button fullWidth onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  const taskCount = data.tasks.length;
  const isReviewed = Boolean(data.reviewedOn);
  const isConfirmed = Boolean(data.confirmedBy);

  if (taskCount === 0) {
    return (
      <div>
        <h2 className={shared.title}>My contribution summary</h2>
        <p className={shared.small}>
          {data.member}
          {SEP}
          {data.role}
        </p>
        <div className={styles.banner}>
          <Alert variant="info" title="No Done tasks yet">
            Your contribution summary is built from saved Done tasks. Mark a task Done with
            evidence, then come back to review your wording.
          </Alert>
        </div>
        <div className={styles.actions}>
          <Button onClick={() => navigate(`${workspacePath}/tasks${search}`)}>Go to Tasks</Button>
          <Button variant="secondary" onClick={() => navigate(completionPath)}>
            Back to Project completion
          </Button>
        </div>
      </div>
    );
  }

  let banner = null;
  if (isConfirmed) {
    banner = (
      <Alert variant="success" title={`Confirmed by ${data.confirmedBy}`}>
        {data.confirmedBy} confirmed your contribution wording on {formatDate(data.confirmedOn)}.
        This is a teammate confirmation of wording, not a verified impact claim.
      </Alert>
    );
  } else if (justSaved) {
    banner = (
      <Alert variant="success" title="Contribution reviewed">
        Your wording is saved. Awaiting {data.reviewer} to confirm it.
      </Alert>
    );
  }

  const statusLabel = isReviewed
      ? `Reviewed${SEP}Awaiting ${data.reviewer}`
      : "Not reviewed yet";

  return (
    <div>
      <h2 className={shared.title}>My contribution summary</h2>
      <p className={shared.small}>
        {data.member}
        {SEP}
        {data.role}
      </p>

      {banner && <div className={styles.banner}>{banner}</div>}

      {!isConfirmed && (
        <p className={styles.statusRow}>
          <span className={styles.chip}>{statusLabel}</span>
        </p>
      )}

      <div className={styles.layout}>
        <div className={styles.column}>
          <ReviewCard
            key={formVersion}
            saved={{ summary: data.summary, note: data.note }}
            locked={isConfirmed}
            taskCount={taskCount}
            reviewer={data.reviewer}
            status={saveStatus}
            onSave={handleSave}
            onCancel={() => navigate(completionPath)}
          />
        </div>

        <section className={styles.column} aria-labelledby="own-tasks-title">
          <h3 id="own-tasks-title" className={shared.cardTitle}>
            Saved Done tasks{SEP}
            {taskCount}
          </h3>
          <DoneTaskList
            tasks={data.tasks}
            taskPath={(taskId) => `${workspacePath}/tasks/${taskId}${search}`}
          />
        </section>
      </div>
    </div>
  );
}

export default ContributionSummary;
