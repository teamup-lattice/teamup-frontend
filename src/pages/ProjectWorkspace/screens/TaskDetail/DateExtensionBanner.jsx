import { useState } from "react";
import Button from "../../../../components/Button";
import Textarea from "../../../../components/Textarea";
import { formatDate } from "../../../CreateProject/formatDate";
import styles from "./DateExtensionBanner.module.css";

function formatDeadline(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatDate(trimmed);
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRequesterName(request) {
  if (typeof request.requester === "string" && request.requester.trim()) {
    return request.requester.trim();
  }

  return (
    request.requester?.name ||
    request.requester?.user?.name ||
    request.requester?.fullName ||
    request.requester?.user?.fullName ||
    "A teammate"
  );
}

function DateExtensionBanner({
  request,
  currentDueDate,
  onDecide,
  deciding = false,
}) {
  const [isDeclining, setIsDeclining] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  const isBusy = deciding || activeStatus !== "";
  const requesterName = getRequesterName(request);
  const currentDeadline = formatDeadline(currentDueDate || request.currentDate);
  const requestedDeadline = formatDeadline(request.requestedDate);
  const reason = typeof request.reason === "string" ? request.reason.trim() : "";

  const submitDecision = async (status, note = "") => {
    if (isBusy) return;

    setActiveStatus(status);
    try {
      await onDecide(status, status === "DECLINED" ? note : undefined);
    } finally {
      setActiveStatus("");
    }
  };

  return (
    <section
      className={styles.banner}
      aria-labelledby={`date-extension-title-${request.id}`}
    >
      <header className={styles.header}>
        <span className={styles.iconCircle} aria-hidden="true">
          <svg
            className={styles.icon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <div className={styles.headerMain}>
          <div className={styles.titleRow}>
            <h3 className={styles.title} id={`date-extension-title-${request.id}`}>
              Date request pending
            </h3>
            <span className={styles.pill}>Pending</span>
          </div>
          <p className={styles.intro}>
            {requesterName} wants to move this deadline.
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.dates}>
          <div className={styles.dateItem}>
            <p className={styles.dateLabel}>Current deadline</p>
            <p className={styles.dateValue}>{currentDeadline || "Not set"}</p>
          </div>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
          <div className={`${styles.dateItem} ${styles.requestedItem}`}>
            <p className={styles.dateLabel}>Requested deadline</p>
            <p className={`${styles.dateValue} ${styles.requestedValue}`}>
              {requestedDeadline || "Not set"}
            </p>
          </div>
        </div>

        {reason && (
          <div>
            <p className={styles.label}>Reason</p>
            <p className={styles.reason}>{reason}</p>
          </div>
        )}

        {isDeclining ? (
          <div className={styles.declinePanel}>
            <Textarea
              label="Decline note (optional)"
              id={`date-extension-note-${request.id}`}
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              maxLength={500}
              rows={3}
              helperText={`${500 - decisionNote.length} characters left`}
              disabled={isBusy}
            />
            <div className={styles.declineActions}>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={isBusy}
                onClick={() => {
                  setIsDeclining(false);
                  setDecisionNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                fullWidth
                loading={activeStatus === "DECLINED"}
                loadingText="Declining…"
                disabled={isBusy}
                onClick={() => submitDecision("DECLINED", decisionNote.trim())}
              >
                Confirm decline
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <Button
              type="button"
              fullWidth
              loading={activeStatus === "ACCEPTED"}
              loadingText="Accepting…"
              disabled={isBusy}
              onClick={() => submitDecision("ACCEPTED")}
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={isBusy}
              onClick={() => setIsDeclining(true)}
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default DateExtensionBanner;
