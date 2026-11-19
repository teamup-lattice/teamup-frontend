import { useEffect, useRef, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { deleteProject } from "../../services/myProjectsService";
import { getErrorMessage } from "../../services/errorMessage";
import { normalizeStatus } from "./statusConfig";
import styles from "./DeleteProjectDialog.module.css";

const FOCUSABLE =
  'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

const DRAFT_BODY =
  "This draft will be removed from your projects. You can't undo this from the app.";

const PUBLISHED_BODY =
  "This project will be removed and will disappear from Discover Projects and from every team member's project list. Its tasks and milestones will no longer be visible. Team members will lose access. You can't undo this from the app.";

function DeleteProjectDialog({ project = {}, onClose, onDeleted }) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const cancelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [confirmation, setConfirmation] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const title =
    typeof project.title === "string" && project.title.trim()
      ? project.title
      : "Untitled project";
  const isDraft = normalizeStatus(project.status) === "DRAFT";
  const isConfirmed =
    isDraft || confirmation.trim() === title.trim();

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    cancelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      const previous = previousFocusRef.current;
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (!isDeleting) onClose();
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
    if (event.target === event.currentTarget && !isDeleting) {
      onClose();
    }
  };

  const handleConfirmationChange = (event) => {
    setConfirmation(event.target.value);
    setSubmitError("");
  };

  const handleDelete = async () => {
    if (isDeleting || !isConfirmed || project.id == null) return;

    setSubmitError("");
    setIsDeleting(true);

    try {
      await deleteProject(project.id);
      setIsDeleting(false);
      onDeleted?.();
    } catch (error) {
      const status = Number(error?.status);

      if (status === 404) {
        setIsDeleting(false);
        onDeleted?.();
        return;
      }

      if (status === 401) {
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      setSubmitError(
        getErrorMessage(error, {
          fallback: "Couldn't delete the project. Try again.",
          byStatus: {
            403: "Only the project owner can delete this project.",
          },
        }),
      );
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        aria-describedby="delete-project-description"
        ref={dialogRef}
        onKeyDown={handleKeyDown}
      >
        <h2
          className={styles.title}
          id="delete-project-title"
          tabIndex={-1}
          ref={headingRef}
        >
          Delete {title}?
        </h2>
        <p className={styles.intro} id="delete-project-description">
          {isDraft ? DRAFT_BODY : PUBLISHED_BODY}
        </p>

        {submitError && (
          <Alert variant="error">
            {submitError}
          </Alert>
        )}

        {!isDraft && (
          <Input
            label="Type the project name to confirm"
            id="delete-project-confirmation"
            name="projectNameConfirmation"
            value={confirmation}
            onChange={handleConfirmationChange}
            autoComplete="off"
            disabled={isDeleting}
          />
        )}

        <div className={styles.actions}>
          <Button
            ref={cancelRef}
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            loading={isDeleting}
            loadingText="Deleting…"
            disabled={!isConfirmed}
            onClick={handleDelete}
          >
            Delete project
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteProjectDialog;
