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
        setOwnedProjects(Array.isArray(data?.projects) ? data.projects : []);
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
            Delete account
          </h2>
          <p className={styles.fieldText}>
            Deleting your account is immediate and can&apos;t be undone from the
            app.
          </p>

          <div className={styles.deletionWarning}>
            <p className={styles.deletionWarningTitle}>
              What happens to projects you own
            </p>
            <p className={styles.deletionWarningText}>
              They are handed to an active manager, or to your longest-standing
              active member if there is no manager. If no active member remains,
              the project is closed.
            </p>
          </div>

          {projectsStatus === "error" && (
            <p className={styles.helper}>Couldn&apos;t load your projects</p>
          )}

          {projectsStatus === "ready" && ownedProjects.length > 0 && (
            <div className={styles.deletionProjects}>
              <p className={styles.deletionProjectsLabel}>Projects you own</p>
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
