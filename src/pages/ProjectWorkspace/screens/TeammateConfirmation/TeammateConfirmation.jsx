import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Skeleton from "../../../../components/Skeleton";
import Textarea from "../../../../components/Textarea";
import StatusTag from "../../shared/StatusTag";
import {
  getProjectContributions,
  reviewContribution,
} from "../../../../services/contributionsService";
import DoneTaskList from "../../shared/DoneTaskList";
import { useContributionContext } from "../../shared/useContributionContext";
import { useSimulate } from "../../useSimulate";
import { SEP, formatDate } from "../../workspaceFormat";
import { APOS } from "../ProjectCompletion/completionHelpers";
import shared from "../shared.module.css";
import styles from "./TeammateConfirmation.module.css";

const LOAD_VARIANTS = ["loadfail", "empty"];

// "Review Teammate's contribution": lists all of a teammate's contributions,
// each as its own card with details, reviews, and Confirm / Request changes actions.
function TeammateConfirmation() {
  const { loading, members, me, doneTasksOf } = useContributionContext();
  const { projectId, member: memberParam } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();
  const variant = LOAD_VARIANTS.includes(simulate) ? simulate : null;

  // The route param is member.user.id (fallback to id or name for robustness).
  const member = members.find(
    (item) =>
      item.userId === String(memberParam) ||
      item.user?.id === String(memberParam) ||
      item.id === String(memberParam) ||
      item.name.toLowerCase() === String(memberParam).toLowerCase(),
  );
  const memberName = member?.name ?? "this member";
  const memberUserId = member?.user?.id ?? member?.userId ?? member?.id;
  const currentUserId = me?.user?.id ?? me?.userId ?? me?.id;

  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState({}); // { [id]: "confirming" | "requesting" }
  const [actionError, setActionError] = useState({}); // { [id]: string }
  const [openRequestId, setOpenRequestId] = useState(null);
  const [requestNotes, setRequestNotes] = useState({});
  const [requestNoteErrors, setRequestNoteErrors] = useState({});

  const fetchContributions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      if (variant === "loadfail") throw new Error("Request failed");
      const list = await getProjectContributions(projectId);
      setContributions(list);
    } catch (err) {
      console.error("Failed to load contributions:", err);
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, variant]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const teammateContributions = useMemo(() => {
    if (!memberUserId) return [];
    return contributions.filter((c) => {
      const cUserId = c.member?.user?.id ?? c.member?.userId ?? c.member?.id;
      return String(cUserId) === String(memberUserId);
    });
  }, [contributions, memberUserId]);

  const tasks = useMemo(() => {
    if (variant === "empty" || !member) return [];
    return doneTasksOf(member);
  }, [variant, member, doneTasksOf]);

  const taskCount = tasks.length;
  const workspacePath = `/projects/${projectId}/workspace`;
  const completionPath = `${workspacePath}/completion${search}`;
  const title = `Review ${memberName}${APOS}s contributions`;

  async function handleConfirm(contributionId) {
    setActionStatus((prev) => ({ ...prev, [contributionId]: "confirming" }));
    setActionError((prev) => ({ ...prev, [contributionId]: "" }));
    try {
      await reviewContribution(projectId, contributionId, {
        decision: "CONFIRMED",
      });
      await fetchContributions();
      setActionStatus((prev) => ({ ...prev, [contributionId]: undefined }));
    } catch (err) {
      console.error("Failed to confirm contribution:", err);
      setActionError((prev) => ({
        ...prev,
        [contributionId]:
          err.message || "Couldn't confirm contribution. Please try again.",
      }));
      setActionStatus((prev) => ({ ...prev, [contributionId]: undefined }));
      if (err?.status === 409) {
        fetchContributions();
      }
    }
  }

  async function handleRequestChangesSubmit(contributionId) {
    const note = (requestNotes[contributionId] || "").trim();
    if (!note) {
      setRequestNoteErrors((prev) => ({
        ...prev,
        [contributionId]: "A note explaining the requested changes is required.",
      }));
      return;
    }
    if (note.length > 1000) {
      setRequestNoteErrors((prev) => ({
        ...prev,
        [contributionId]: "Keep the note to 1000 characters or fewer.",
      }));
      return;
    }

    setActionStatus((prev) => ({ ...prev, [contributionId]: "requesting" }));
    setActionError((prev) => ({ ...prev, [contributionId]: "" }));
    try {
      await reviewContribution(projectId, contributionId, {
        decision: "CHANGES_REQUESTED",
        note,
      });
      setOpenRequestId(null);
      setRequestNotes((prev) => ({ ...prev, [contributionId]: "" }));
      await fetchContributions();
      setActionStatus((prev) => ({ ...prev, [contributionId]: undefined }));
    } catch (err) {
      console.error("Failed to request changes:", err);
      setActionError((prev) => ({
        ...prev,
        [contributionId]:
          err.message || "Couldn't submit changes request. Please try again.",
      }));
      setActionStatus((prev) => ({ ...prev, [contributionId]: undefined }));
      if (err?.status === 409) {
        fetchContributions();
      }
    }
  }

  if (!loading && !member) {
    return (
      <div>
        <h2 className={shared.title}>Review contributions</h2>
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

  if (isLoading || loading) {
    return (
      <div>
        <h2 className={shared.title}>{title}</h2>
        <p role="status">Loading contributions…</p>
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className={shared.title}>{title}</h2>
        <Alert variant="error" title="Couldn't load contributions">
          {error}
        </Alert>
        <div className={styles.actions}>
          <Button onClick={fetchContributions}>Retry</Button>
          <Button variant="secondary" onClick={() => navigate(completionPath)}>
            Back to Project completion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className={shared.title}>{title}</h2>
      <p className={shared.small}>
        {member.role}
        {SEP}
        {taskCount} saved Done {taskCount === 1 ? "task" : "tasks"}
      </p>

      <div className={styles.layout}>
        <div className={styles.column}>
          {teammateContributions.length === 0 ? (
            <section className={shared.card}>
              <p className={shared.text}>
                No contributions found for {memberName}.
              </p>
            </section>
          ) : (
            teammateContributions.map((contribution) => {
              const isConfirmed = contribution.status === "CONFIRMED";
              const authorUserId =
                contribution.member?.user?.id ??
                contribution.member?.userId ??
                memberUserId;
              const isAuthor =
                Boolean(currentUserId) &&
                String(authorUserId) === String(currentUserId);
              const isBusy = Boolean(actionStatus[contribution.id]);
              const buttonsDisabled = isConfirmed || isAuthor || isBusy;

              const sortedReviews = [
                ...(Array.isArray(contribution.reviews)
                  ? contribution.reviews
                  : []),
              ].sort((a, b) => {
                const aTime = Date.parse(a.createdAt);
                const bTime = Date.parse(b.createdAt);
                return (
                  (Number.isNaN(bTime) ? 0 : bTime) -
                  (Number.isNaN(aTime) ? 0 : aTime)
                );
              });

              const isRequestFormOpen = openRequestId === contribution.id;

              return (
                <article key={contribution.id} className={shared.card}>
                  <div className={styles.statusRow}>
                    <h3 className={shared.cardTitle}>
                      {contribution.title || "Untitled contribution"}
                    </h3>
                    {contribution.status && (
                      <StatusTag status={contribution.status} />
                    )}
                  </div>

                  {contribution.description && (
                    <p className={shared.text}>{contribution.description}</p>
                  )}

                  {contribution.task && (
                    <p className={shared.small}>
                      <strong>Task: </strong>
                      {contribution.task.title ||
                        contribution.task.name ||
                        (typeof contribution.task === "string"
                          ? contribution.task
                          : "Assigned task")}
                    </p>
                  )}

                  {Array.isArray(contribution.evidence) &&
                    contribution.evidence.length > 0 && (
                      <div className={styles.evidenceBlock}>
                        <p className={shared.small}>
                          <strong>Evidence:</strong>
                        </p>
                        <ul className={styles.evidenceList}>
                          {contribution.evidence.map((item, idx) => (
                            <li key={item.id || idx}>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {item.title ||
                                    item.label ||
                                    item.name ||
                                    item.url}
                                </a>
                              ) : (
                                <span>
                                  {item.title ||
                                    item.label ||
                                    item.name ||
                                    "Evidence"}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {sortedReviews.length > 0 && (
                    <div className={styles.reviewsList}>
                      <h4 className={styles.reviewsHeading}>Reviews</h4>
                      {sortedReviews.map((rev, revIdx) => (
                        <div
                          key={rev.id || `${revIdx}-${rev.createdAt}`}
                          className={styles.reviewItem}
                        >
                          <div className={styles.reviewMeta}>
                            <strong>
                              {rev.reviewer?.name || "A teammate"}
                            </strong>
                            <span className={styles.reviewDecision}>
                              {rev.decision}
                            </span>
                            {rev.createdAt && (
                              <span>{formatDate(rev.createdAt)}</span>
                            )}
                          </div>
                          {rev.note && (
                            <p className={styles.noteText}>{rev.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {actionError[contribution.id] && (
                    <div
                      className={styles.errorSpace}
                      style={{ marginTop: "0.75rem" }}
                    >
                      <Alert variant="error" title="Review failed">
                        {actionError[contribution.id]}
                      </Alert>
                    </div>
                  )}

                  {isAuthor && (
                    <p className={shared.small}>
                      You cannot review your own contribution.
                    </p>
                  )}

                  <div className={styles.actions}>
                    <Button
                      disabled={buttonsDisabled}
                      loading={actionStatus[contribution.id] === "confirming"}
                      loadingText="Confirming…"
                      onClick={() => handleConfirm(contribution.id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={buttonsDisabled}
                      onClick={() =>
                        setOpenRequestId((curr) =>
                          curr === contribution.id ? null : contribution.id,
                        )
                      }
                    >
                      Request changes
                    </Button>
                  </div>

                  {isRequestFormOpen && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRequestChangesSubmit(contribution.id);
                      }}
                      className={styles.formStack}
                      style={{ marginTop: "1rem" }}
                    >
                      <Textarea
                        id={`request-changes-note-${contribution.id}`}
                        label="Reason for requested changes"
                        required
                        rows={3}
                        maxLength={1000}
                        value={requestNotes[contribution.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRequestNotes((prev) => ({
                            ...prev,
                            [contribution.id]: val,
                          }));
                          setRequestNoteErrors((prev) => ({
                            ...prev,
                            [contribution.id]: undefined,
                          }));
                        }}
                        error={requestNoteErrors[contribution.id]}
                        helperText={`${(requestNotes[contribution.id] || "").length}/1000 characters`}
                        disabled={actionStatus[contribution.id] === "requesting"}
                      />
                      <div className={styles.actions}>
                        <Button
                          type="submit"
                          loading={actionStatus[contribution.id] === "requesting"}
                          loadingText="Submitting…"
                          disabled={actionStatus[contribution.id] === "requesting"}
                        >
                          Submit request
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={actionStatus[contribution.id] === "requesting"}
                          onClick={() => setOpenRequestId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })
          )}

          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => navigate(completionPath)}
            >
              Back to Project completion
            </Button>
          </div>
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
              tasks={tasks}
              projectId={projectId}
              taskPath={(taskId) => `${workspacePath}/tasks/${taskId}${search}`}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default TeammateConfirmation;
