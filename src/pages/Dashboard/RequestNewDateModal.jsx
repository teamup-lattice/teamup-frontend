import { useEffect, useRef, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import { createDateExtensionRequest } from "../../services/dateExtensionsService";
import styles from "./RequestNewDateModal.module.css";

const FOCUSABLE =
  'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

function startOfDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function getMinDate(rawDueDate) {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueDate = startOfDay(rawDueDate);
  if (!dueDate) return tomorrow;

  const dayAfterDue = new Date(dueDate);
  dayAfterDue.setDate(dayAfterDue.getDate() + 1);
  return dayAfterDue < tomorrow ? tomorrow : dayAfterDue;
}

function formatDateInput(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getRequestErrorMessage(error) {
  switch (Number(error?.status)) {
    case 400:
      return "That date is not valid. Choose a date after the current deadline.";
    case 403:
      return "You don't have permission to request a new date for this task.";
    case 404:
      return "This task could not be found. Refresh the dashboard and try again.";
    case 409:
      return "You already asked for a new date on this task.";
    default:
      return "We couldn't send your date request. Try again.";
  }
}

function RequestNewDateModal({
  projectId,
  taskId,
  taskTitle,
  rawDueDate,
  onClose,
  onSuccess,
}) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const previousFocusRef = useRef(null);
  const minDate = formatDateInput(getMinDate(rawDueDate));
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    headingRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (!isSubmitting) onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const items = Array.from(
      dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [],
    );
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (
      event.shiftKey &&
      (active === first || active === headingRef.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setFieldErrors((current) => ({ ...current, date: "" }));
    setSubmitError("");
  };

  const handleReasonChange = (event) => {
    setReason(event.target.value);
    setFieldErrors((current) => ({ ...current, reason: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = {};
    const selectedDate = date ? new Date(`${date}T00:00:00`) : null;
    const earliestDate = new Date(`${minDate}T00:00:00`);
    const trimmedReason = reason.trim();

    if (!selectedDate || Number.isNaN(selectedDate.getTime())) {
      nextErrors.date = "Choose a new date.";
    } else if (selectedDate < earliestDate) {
      nextErrors.date = "Choose a date after the current deadline.";
    } else if (selectedDate <= new Date()) {
      nextErrors.date = "Choose a future date.";
    }

    if (!trimmedReason) {
      nextErrors.reason = "Add a reason for the new date.";
    } else if (trimmedReason.length > 1000) {
      nextErrors.reason = "Keep your reason to 1000 characters or fewer.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!projectId || !taskId) {
      setSubmitError(
        "This task is missing information. Refresh the dashboard and try again.",
      );
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const requestedDate = new Date(`${date}T23:59:59.999`).toISOString();
      await createDateExtensionRequest(projectId, {
        taskId,
        requestedDate,
        reason: trimmedReason,
      });
      setIsSubmitting(false);
      onSuccess();
    } catch (error) {
      setSubmitError(getRequestErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-new-date-title"
        aria-describedby="request-new-date-description"
        ref={dialogRef}
        onKeyDown={handleKeyDown}
      >
        <h2
          className={styles.title}
          id="request-new-date-title"
          tabIndex={-1}
          ref={headingRef}
        >
          Request a new date
        </h2>
        <p className={styles.intro} id="request-new-date-description">
          Propose a new date for <strong>{taskTitle}</strong>. The project
          owner will review it.
        </p>

        {submitError && (
          <Alert variant="error" title="Request not sent">
            {submitError}
          </Alert>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Proposed new date"
            type="date"
            id="request-new-date"
            name="requestedDate"
            min={minDate}
            value={date}
            onChange={handleDateChange}
            error={fieldErrors.date}
            disabled={isSubmitting}
            required
          />
          <Textarea
            label="Reason"
            id="request-new-date-reason"
            name="reason"
            value={reason}
            onChange={handleReasonChange}
            maxLength={1000}
            rows={5}
            helperText={`${reason.length}/1000 characters`}
            error={fieldErrors.reason}
            disabled={isSubmitting}
            required
          />
          <div className={styles.actions}>
            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              loadingText="Sending request"
            >
              Send request
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestNewDateModal;
