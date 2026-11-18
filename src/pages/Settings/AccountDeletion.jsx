import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { clearToken } from "../../services/api";
import { getMyProjects } from "../../services/myProjectsService";
import { deleteAccount } from "../../services/settingsService";
import styles from "./Settings.module.css";

const DRAFT_BACKUP_KEY = "teamup:createProject:draft";
const OWNED_PREVIEW_LIMIT = 5;

function getProjectTitle(project) {
  return typeof project.title === "string" && project.title.trim()
    ? project.title
    : "Untitled project";
}

function AccountDeletion() {
  const navigate = useNavigate();
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [projectsStatus, setProjectsStatus] = useState("loading");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getMyProjects()
      .then((data) => {
        if (!isMounted) return;
        const projects = Array.isArray(data?.projects) ? data.projects : [];
        setOwnedProjects(projects.filter((project) => project.isOwner !== false));
        setProjectsStatus("ready");
      })
      .catch((loadError) => {
        console.error("Failed to load owned projects:", loadError);
        if (isMounted) setProjectsStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isConfirmed = confirmation.trim() === "DELETE";
  const visibleProjects = ownedProjects.slice(0, OWNED_PREVIEW_LIMIT);
  const remainingProjects = ownedProjects.length - OWNED_PREVIEW_LIMIT;

  const handleConfirmationChange = (event) => {
    setConfirmation(event.target.value);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setError("");

    try {
      await deleteAccount();
      clearToken();
      sessionStorage.removeItem(DRAFT_BACKUP_KEY);
      navigate("/", { replace: true });
    } catch (deleteError) {
      if (deleteError?.status === 401) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }
      if (deleteError?.status === 404) {
        clearToken();
        sessionStorage.removeItem(DRAFT_BACKUP_KEY);
        navigate("/", { replace: true });
        return;
      }
      console.error("Failed to delete account:", deleteError);
      setError("Couldn't delete your account. Check your connection and try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.heading}>Delete account</h1>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link to="/settings" className={styles.textLink}>
            Settings
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Delete account</span>
        </nav>
      </div>

      <div className={styles.deletionBody}>
        {error && (
          <Alert variant="error" title="Account not deleted">
            {error}
          </Alert>
        )}

        <section className={styles.card} aria-labelledby="deletion-heading">
          <h2 className={styles.cardTitle} id="deletion-heading">
            Before you delete your account
          </h2>

          <div className={styles.deletionWarning}>
            <p className={styles.deletionWarningTitle}>
              This can&apos;t be undone
            </p>
            <p className={styles.deletionWarningText}>
              Deleting your account is immediate. You can&apos;t undo it from the
              app.
            </p>
          </div>

          {projectsStatus === "ready" && ownedProjects.length > 0 && (
            <div className={styles.deletionProjects}>
              <p className={styles.deletionProjectsLabel}>
                What happens to projects you own
              </p>
              <p className={styles.deletionProjectsText}>
                Each project you own is handed to an active manager, or to its
                longest-standing active member. If no active member remains, the
                project is closed.
              </p>

              <ul className={styles.deletionProjectList}>
                {visibleProjects.map((project, index) => (
                  <li
                    className={styles.deletionProjectItem}
                    key={project.id ?? `${getProjectTitle(project)}-${index}`}
                  >
                    {getProjectTitle(project)}
                  </li>
                ))}
              </ul>
              {remainingProjects > 0 && (
                <p className={styles.helper}>and {remainingProjects} more</p>
              )}
            </div>
          )}

          {projectsStatus === "error" && (
            <p className={styles.helper}>Couldn&apos;t load your projects</p>
          )}

          <div className={styles.consequences}>
            <p className={styles.consequencesHeading}>What will happen</p>
            <ul className={styles.consequencesList}>
              <li>You&apos;ll be signed out everywhere</li>
              <li>Pending invitations and join requests are cancelled</li>
              <li>Your project memberships end</li>
              <li>Your open tasks are unassigned</li>
              <li>Your profile is anonymised</li>
            </ul>
          </div>

          <form className={styles.deletionForm} onSubmit={handleSubmit}>
            <Input
              label="Type DELETE to confirm"
              helperText="This is case-sensitive."
              id="delete-account-confirmation"
              name="deleteAccountConfirmation"
              value={confirmation}
              onChange={handleConfirmationChange}
              autoComplete="off"
              disabled={isDeleting}
            />

            <div className={styles.buttonRow}>
              <Button
                variant="secondary"
                onClick={() => navigate("/settings")}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={isDeleting}
                loadingText="Deleting…"
                disabled={!isConfirmed || isDeleting}
              >
                Delete account
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AccountDeletion;
