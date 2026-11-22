import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Skeleton from "../../../../components/Skeleton";
import { confirmContribution } from "../../../../services/contributionsService";
import DoneTaskList from "../../shared/DoneTaskList";
import { useContribution } from "../../shared/useContribution";
import { useContributionContext } from "../../shared/useContributionContext";
import { useSimulate } from "../../useSimulate";
import { SEP, formatDate, numberWord } from "../../workspaceFormat";
import { APOS } from "../ProjectCompletion/completionHelpers";
import shared from "../shared.module.css";
import styles from "./TeammateConfirmation.module.css";

const LOAD_VARIANTS = ["loadfail", "empty"];

// "Review David's contribution": the assigned teammate checks a member's
// reviewed contribution wording against their saved Done tasks and confirms
// it. Confirmation covers wording only; it is not a verified impact claim.
function TeammateConfirmation() {
  const { loading, members, me, ownerName, doneTasksOf } = useContributionContext();
  const { projectId, member: memberParam } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();
  const variant = LOAD_VARIANTS.includes(simulate) ? simulate : null;

  // The route param is the member id (a lowercase name also works).
  const member = members.find(
    (item) =>
      item.id === String(memberParam) ||
      item.name.toLowerCase() === String(memberParam).toLowerCase(),
  );
  const memberName = member?.name ?? "this member";

  const input = useMemo(
    () =>
      loading || !member
        ? null
        : { member, members, tasks: doneTasksOf(member), ownerName },
    [loading, member, members, doneTasksOf, ownerName],
  );

  const { isLoading, data, error, retry, update } = useContribution({
    projectId,
    input,
    variant,
  });

  const [status, setStatus] = useState("idle"); // idle | confirming | error
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [failNext, setFailNext] = useState(simulate === "fail");
  const errorRef = useRef(null);

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  const workspacePath = `/projects/${projectId}/workspace`;
  const completionPath = `${workspacePath}/completion${search}`;
  const title = `Review ${memberName}${APOS}s contribution`;

  async function handleConfirm() {
    setStatus("confirming");
    const shouldFail = failNext;
    setFailNext(false);
    try {
      const saved = await confirmContribution(projectId, data.contributionId, {
        simulateFail: shouldFail,
      });
      update(saved);
      setStatus("idle");
      setJustConfirmed(true);
    } catch (confirmError) {
      console.error("Failed to confirm contribution:", confirmError);
      setStatus("error");
    }
  }

  if (!loading && !member) {
    return (
      <div>
        <h2 className={shared.title}>Review contribution</h2>
        <Alert variant="error" title="Member not found">
          This person is not a member of this project.
        </Alert>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate(completionPath)}>
            Back to Project completion
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h2 className={shared.title}>{title}</h2>
        <p role="status">Loading contribution…</p>
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h2 className={shared.title}>{title}</h2>
        <Alert variant="error" title="Couldn't load this contribution">
          {error || "Something went wrong. Try again."}
        </Alert>
        <div className={styles.actions}>
          <Button onClick={retry}>Retry</Button>
          <Button variant="secondary" onClick={() => navigate(completionPath)}>
            Back to Project completion
          </Button>
        </div>
      </div>
    );
  }

  const taskCount = data.tasks.length;
  const isConfirmed = Boolean(data.confirmedBy);
  const isReviewed = Boolean(data.reviewedOn);
  const isOwnContribution = data.memberId === me.id;
  const isAssignedReviewer = data.reviewerId === me.id;
  const canConfirm =
    !isOwnContribution &&
    isAssignedReviewer &&
    isReviewed &&
    !isConfirmed &&
    taskCount > 0 &&
    Boolean(data.contributionId);

  const confirmedCount = data.team.confirmedOthers + (isConfirmed ? 1 : 0);
  const allConfirmed = confirmedCount === data.team.total;

  // One notice at the top says why the viewer can or cannot confirm.
  let banner;
  if (justConfirmed) {
    banner = (
      <Alert variant="success" title="Contribution confirmed">
        {allConfirmed
          ? `All ${numberWord(data.team.total)} member confirmations are saved. ${data.team.ownerName} can now complete the project.`
          : `${confirmedCount}/${data.team.total} member confirmations saved.`}
      </Alert>
    );
  } else if (isConfirmed) {
    banner = (
      <Alert variant="success" title={`Confirmed by ${data.confirmedBy}`}>
        {data.confirmedBy} confirmed {data.member}
        {APOS}s contribution wording on {formatDate(data.confirmedOn)}.
      </Alert>
    );
  } else if (isOwnContribution) {
    banner = (
      <Alert variant="info" title="You can't confirm your own contribution">
        {data.reviewer} confirms your wording. You can review and edit it from your own summary.
      </Alert>
    );
  } else if (!isAssignedReviewer) {
    banner = (
      <Alert variant="info" title={`Only ${data.reviewer} can confirm this`}>
        {data.reviewer} is the assigned teammate for {data.member}
        {APOS}s contribution. You can read it, but you can{APOS}t confirm it.
      </Alert>
    );
  } else if (!isReviewed) {
    banner = (
      <Alert variant="info" title={`${data.member} needs to review their own wording first`}>
        You can confirm once {data.member} saves their own contribution as Reviewed.
      </Alert>
    );
  } else if (taskCount === 0) {
    banner = (
      <Alert variant="info" title="No Done tasks to check">
        {data.member} has no saved Done tasks yet, so there is nothing to confirm.
      </Alert>
    );
  }

  const backButton = (
    <Button variant="secondary" onClick={() => navigate(completionPath)}>
      {justConfirmed || !canConfirm ? "Back to Project completion" : "Cancel"}
    </Button>
  );

  return (
    <div>
      <h2 className={shared.title}>{title}</h2>
      <p className={shared.small}>
        {data.role}
        {SEP}
        {taskCount} saved Done {taskCount === 1 ? "task" : "tasks"}
      </p>

      {banner && <div className={styles.banner}>{banner}</div>}

      <div className={styles.layout}>
        <div className={styles.column}>
          <section className={shared.card} aria-labelledby="review-wording-title">
            <h3 id="review-wording-title" className={shared.cardTitle}>
              {data.member}
              {APOS}s reviewed wording
            </h3>
            <p className={styles.person}>
              <span className={shared.avatar} aria-hidden="true">
                {data.member.charAt(0)}
              </span>
              <span>
                {data.member}
                {SEP}
                {data.role}
              </span>
            </p>
            {isReviewed ? (
              <>
                <div className={styles.noteBox}>
                  <p>
                    <strong>{data.summary}</strong>
                  </p>
                </div>
                {data.note && <p className={shared.text}>{data.note}</p>}
                <p className={shared.small}>
                  Reviewed by {data.member} on {formatDate(data.reviewedOn)}.
                </p>
              </>
            ) : (
              <p className={shared.text}>{data.member} has not saved their own wording yet.</p>
            )}
          </section>

          {(canConfirm || justConfirmed) && (
            <section className={shared.card} aria-labelledby="your-confirmation-title">
              <h3 id="your-confirmation-title" className={shared.cardTitle}>
                Your confirmation
              </h3>
              {justConfirmed ? (
                <p className={shared.text}>
                  You confirmed this wording. Saved task ownership and history are unchanged.
                </p>
              ) : (
                <>
                  <p className={shared.text}>
                    Confirm that {data.member}
                    {APOS}s wording fairly describes their saved Done tasks. This is a teammate
                    confirmation of wording, not a verified impact claim.
                  </p>
                  {status === "error" && (
                    <div
                      ref={errorRef}
                      tabIndex={-1}
                      className={`${shared.errorWrap} ${styles.errorSpace}`}
                    >
                      <Alert variant="error" title="Couldn't save your confirmation">
                        Nothing was changed. Check your connection and try again.
                      </Alert>
                    </div>
                  )}
                  <div className={styles.actions}>
                    <Button
                      loading={status === "confirming"}
                      loadingText="Confirming…"
                      onClick={handleConfirm}
                    >
                      {status === "error" ? "Retry confirmation" : "Confirm contribution"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={status === "confirming"}
                      onClick={() => navigate(completionPath)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className={shared.small}>Cancel leaves everything unchanged.</p>
                </>
              )}
            </section>
          )}

          {(!canConfirm || justConfirmed) && <div className={styles.actions}>{backButton}</div>}
        </div>

        <section className={styles.column} aria-labelledby="review-tasks-title">
          <h3 id="review-tasks-title" className={shared.cardTitle}>
            Saved Done tasks{SEP}
            {taskCount}
          </h3>
          {taskCount === 0 ? (
            <p className={shared.text}>No saved Done tasks.</p>
          ) : (
            <DoneTaskList
              tasks={data.tasks}
              taskPath={(taskId) => `${workspacePath}/tasks/${taskId}${search}`}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default TeammateConfirmation;
