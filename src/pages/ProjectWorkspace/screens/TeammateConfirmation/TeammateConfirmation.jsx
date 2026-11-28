import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import { ArrowUpRightIcon, PaperclipIcon } from "../../../../components/Icons";
import Skeleton from "../../../../components/Skeleton";
import Textarea from "../../../../components/Textarea";
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

function getStatusNote({
  isConfirmed,
  isAcknowledged,
  latestReview,
  authorName,
  reviewerName,
  isSelfReview,
}) {
  if (isConfirmed) {
    const confirmedBy = latestReview?.reviewer?.name;
    const confirmedOn = latestReview?.createdAt
      ? formatDate(latestReview.createdAt)
      : "";
    return {
      title: "Confirmed",
      detail: confirmedBy
        ? `Confirmed by ${confirmedBy}${confirmedOn ? `${SEP}${confirmedOn}` : ""}`
        : "This contribution wording is confirmed.",
    };
  }

  if (latestReview?.decision === "CHANGES_REQUESTED") {
    return {
      title: "Changes requested",
      detail:
        latestReview.note ||
        "A teammate requested changes to this contribution wording.",
    };
  }

  if (!isAcknowledged) {
    return {
      title: "Awaiting acknowledgement",
      detail: `Waiting for ${authorName} to acknowledge this summary`,
    };
  }

  if (isSelfReview) {
    return {
      title: `Reviewed${SEP}Ready for your confirmation`,
      detail: "You can confirm your own contribution wording.",
    };
  }

  return {
    title: `Reviewed${SEP}Awaiting ${reviewerName}`,
    detail: "The wording is saved and ready for confirmation.",
  };
}

// "Review Teammate's contribution": lists all of a teammate's contributions,
// each as its own card with details, reviews, and Confirm / Request changes actions.
function TeammateConfirmation() {
  const {
    loading,
    members,
    me,
    doneTasksOf,
    isOwner,
    canManageMembers,
    ownerName,
  } = useContributionContext();
  const { projectId, member: memberParam } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();
  const variant = LOAD_VARIANTS.includes(simulate) ? simulate : null;
  const isOwnerOrManager = Boolean(isOwner || canManageMembers);

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

  async function handleConfirm(contributionId, authorName, isSelfReview = false) {
    setActionStatus((prev) => ({ ...prev, [contributionId]: "confirming" }));
    setActionError((prev) => ({ ...prev, [contributionId]: "" }));
    try {
      await reviewContribution(
        projectId,
        contributionId,
        {
          decision: "CONFIRMED",
        },
        { authorName, isSelfReview },
      );
      await fetchContributions();
      setActionStatus((prev) => ({ ...prev, [contributionId]: undefined }));
    } catch (err) {
      console.error("Failed to confirm contribution:", err);
      const isNotAck =
        err?.status === 409 &&
        (err.message?.toLowerCase().includes("not acknowledged") ||
          err.message?.toLowerCase().includes("has not acknowledged") ||
          err.code === "NOT_ACKNOWLEDGED");
      setActionError((prev) => ({
        ...prev,
        [contributionId]: isNotAck
          ? `Waiting for ${authorName} to acknowledge this summary`
          : err.message || "Couldn't confirm contribution. Please try again.",
      }));
      setActionStatus((prev) => ({ ...prev, [contributionId]: undefined }));
      if (err?.status === 409) {
        fetchContributions();
      }
    }
  }

  async function handleRequestChangesSubmit(contributionId, authorName) {
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
      await reviewContribution(
        projectId,
        contributionId,
        {
          decision: "CHANGES_REQUESTED",
          note,
        },
        { authorName },
      );
      setOpenRequestId(null);
      setRequestNotes((prev) => ({ ...prev, [contributionId]: "" }));
      await fetchContributions();
      setActionStatus((prev) => ({ ...prev, [contributionId]: undefined }));
    } catch (err) {
      console.error("Failed to request changes:", err);
      const isNotAck =
        err?.status === 409 &&
        (err.message?.toLowerCase().includes("not acknowledged") ||
          err.message?.toLowerCase().includes("has not acknowledged") ||
          err.code === "NOT_ACKNOWLEDGED");
      setActionError((prev) => ({
        ...prev,
        [contributionId]: isNotAck
          ? `Waiting for ${authorName} to acknowledge this summary`
          : err.message || "Couldn't submit changes request. Please try again.",
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
              const isSelfReview = Boolean(isOwner && isAuthor);
              const canReview = isOwnerOrManager && (!isAuthor || isOwner);
              const canRequestChanges = isOwnerOrManager && !isAuthor;
              const authorName =
                contribution.member?.user?.name ||
                contribution.member?.name ||
                memberName;
              const isAcknowledged =
                contribution.memberAcknowledgedAt !== null &&
                contribution.memberAcknowledgedAt !== undefined &&
                contribution.memberAcknowledgedAt !== "";
              const isBusy = Boolean(actionStatus[contribution.id]);
              const buttonsDisabled = isConfirmed || isBusy;

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
              const authorRole =
                contribution.member?.role || member?.role || "";
              const latestReview = sortedReviews[0] ?? null;
              const reviewerName = isSelfReview
                ? "you"
                : canReview
                  ? me?.name || "you"
                  : ownerName || "the project owner";
              const statusNote = getStatusNote({
                isConfirmed,
                isAcknowledged,
                latestReview,
                authorName,
                reviewerName,
                isSelfReview,
              });

              return (
                <div key={contribution.id} className={styles.contributionGroup}>
                  <article className={`${shared.card} ${styles.personCard}`}>
                    <header className={styles.personHeader}>
                      <span className={shared.avatar} aria-hidden="true">
                        {authorName.charAt(0)}
                      </span>
                      <span className={styles.personMeta}>
                        <span className={styles.personName}>{authorName}</span>
                        {authorRole && (
                          <span className={styles.personRole}>
                            {SEP}
                            {authorRole}
                          </span>
                        )}
                      </span>
                    </header>

                    <h3 className={styles.summaryTitle}>
                      {contribution.title || "Untitled contribution"}
                    </h3>

                    {contribution.description && (
                      <p className={styles.summaryBody}>
                        {contribution.description}
                      </p>
                    )}

                    {Array.isArray(contribution.evidence) &&
                      contribution.evidence.length > 0 && (
                        <div className={styles.evidenceBlock}>
                          <p className={styles.evidenceLabel}>Evidence</p>
                          <ul className={styles.evidenceList}>
                            {contribution.evidence.map((item, idx) => {
                              const label =
                                item.title ||
                                item.label ||
                                item.name ||
                                item.url ||
                                "Evidence";
                              const content = (
                                <>
                                  <span
                                    className={styles.evidenceIcon}
                                    aria-hidden="true"
                                  >
                                    <PaperclipIcon />
                                  </span>
                                  <span className={styles.evidenceName}>
                                    {label}
                                  </span>
                                  <span
                                    className={styles.evidenceArrow}
                                    aria-hidden="true"
                                  >
                                    <ArrowUpRightIcon />
                                  </span>
                                </>
                              );
                              return (
                                <li key={item.id || idx}>
                                  {item.url ? (
                                    <a
                                      className={styles.evidenceLink}
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {content}
                                    </a>
                                  ) : (
                                    <span className={styles.evidenceLink}>
                                      {content}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                    <div className={styles.statusNote}>
                      <p className={styles.statusNoteTitle}>
                        {statusNote.title}
                      </p>
                      <p className={styles.statusNoteText}>
                        {statusNote.detail}
                      </p>
                    </div>

                    {sortedReviews.length > 0 && (
                      <section className={styles.reviewsList}>
                        <h4 className={styles.reviewsHeading}>
                          Review history
                        </h4>
                        <ul className={styles.reviewsItems}>
                          {sortedReviews.map((rev, revIdx) => {
                            const decisionLabel =
                              rev.decision === "CONFIRMED"
                                ? "Confirmed"
                                : rev.decision === "CHANGES_REQUESTED"
                                  ? "Changes requested"
                                  : rev.decision;
                            const decisionTone =
                              rev.decision === "CONFIRMED"
                                ? styles.reviewPillConfirmed
                                : rev.decision === "CHANGES_REQUESTED"
                                  ? styles.reviewPillChanges
                                  : styles.reviewPillNeutral;
                            return (
                              <li
                                key={rev.id || `${revIdx}-${rev.createdAt}`}
                                className={styles.reviewItem}
                              >
                                <div className={styles.reviewMeta}>
                                  <span className={styles.reviewerName}>
                                    {rev.reviewer?.name || "A teammate"}
                                  </span>
                                  <span
                                    className={`${styles.reviewPill} ${decisionTone}`}
                                  >
                                    {decisionLabel}
                                  </span>
                                  {rev.createdAt && (
                                    <span className={styles.reviewDate}>
                                      {formatDate(rev.createdAt)}
                                    </span>
                                  )}
                                </div>
                                {rev.note && (
                                  <p className={styles.reviewNote}>
                                    {rev.note}
                                  </p>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    )}
                  </article>

                  {!isConfirmed && (
                    <section
                      className={`${shared.card} ${styles.confirmationCard}`}
                      aria-label={`${authorName}${APOS}s confirmation`}
                    >
                    <h3 className={styles.confirmationTitle}>
                      {authorName}
                      {APOS}s confirmation
                    </h3>
                    <p className={styles.confirmationHelper}>
                      {canReview && !canRequestChanges
                        ? "Confirm your contribution wording."
                        : "Confirm the contribution wording or request changes."}
                    </p>

                    {actionError[contribution.id] && (
                      <div className={styles.errorSpace}>
                        <Alert variant="error" title="Review failed">
                          {actionError[contribution.id]}
                        </Alert>
                      </div>
                    )}

                    {!isAcknowledged ? (
                      <p className={styles.confirmationNote}>
                        Waiting for {authorName} to acknowledge this summary
                      </p>
                    ) : canReview ? (
                      <div className={styles.actions}>
                        <Button
                          disabled={buttonsDisabled}
                          loading={
                            actionStatus[contribution.id] === "confirming"
                          }
                          loadingText="Confirming…"
                          onClick={() =>
                            handleConfirm(
                              contribution.id,
                              authorName,
                              isSelfReview,
                            )
                          }
                        >
                          Confirm
                        </Button>
                        {canRequestChanges && (
                          <Button
                            variant="secondary"
                            disabled={buttonsDisabled}
                            onClick={() =>
                              setOpenRequestId((curr) =>
                                curr === contribution.id
                                  ? null
                                  : contribution.id,
                              )
                            }
                          >
                            Request changes
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className={styles.confirmationNote}>
                        Only the project owner or a manager can review
                        contributions.
                      </p>
                    )}

                    {canRequestChanges && isAcknowledged && isRequestFormOpen && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRequestChangesSubmit(
                            contribution.id,
                            authorName,
                          );
                        }}
                        className={styles.formStack}
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
                          disabled={
                            actionStatus[contribution.id] === "requesting"
                          }
                        />
                        <div className={styles.actions}>
                          <Button
                            type="submit"
                            loading={
                              actionStatus[contribution.id] === "requesting"
                            }
                            loadingText="Submitting…"
                            disabled={
                              actionStatus[contribution.id] === "requesting"
                            }
                          >
                            Submit request
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={
                              actionStatus[contribution.id] === "requesting"
                            }
                            onClick={() => setOpenRequestId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                    </section>
                  )}
                </div>
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
          <h3 id="review-tasks-title" className={styles.savedTasksTitle}>
            Saved Done tasks{SEP}
            {taskCount}
          </h3>
          {taskCount === 0 ? (
            <p className={styles.savedTasksEmpty}>No saved Done tasks.</p>
          ) : (
            <div className={styles.savedTasks}>
              <DoneTaskList
                tasks={tasks}
                projectId={projectId}
                taskPath={(taskId) => `${workspacePath}/tasks/${taskId}${search}`}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default TeammateConfirmation;
