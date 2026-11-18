import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import {
  getSharingPrivacy,
  shareProject,
  unshareProject,
} from "../../services/sharingPrivacyService";
import shared from "../ProjectWorkspace/screens/shared.module.css";
import styles from "./SharingPrivacy.module.css";

function NoticeIcon({ tone }) {
  const iconClass = {
    info: styles.noticeIconInfo,
    success: styles.noticeIconSuccess,
    error: styles.noticeIconError,
  }[tone];
  const iconPath = {
    info: (
      <>
        <circle cx="10" cy="10" r="8" />
        <path d="M10 9v5M10 6.25h.01" />
      </>
    ),
    success: (
      <>
        <circle cx="10" cy="10" r="8" />
        <path d="m6.5 10 2.25 2.25L13.75 7.5" />
      </>
    ),
    error: (
      <>
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v5M10 14h.01" />
      </>
    ),
  }[tone];

  return (
    <svg
      className={`${styles.noticeIcon} ${iconClass}`}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {iconPath}
      </g>
    </svg>
  );
}

function Notice({ tone, title, children }) {
  const toneClass = {
    info: styles.noticeInfo,
    success: styles.noticeSuccess,
    error: styles.noticeError,
  }[tone];

  return (
    <div
      className={`${styles.notice} ${toneClass}`}
      role="status"
    >
      <p className={styles.noticeTitle}>
        <NoticeIcon tone={tone} />
        {title}
      </p>
      <p className={styles.noticeText}>{children}</p>
    </div>
  );
}

function actionErrorMessage(error) {
  if (error?.status === 403) {
    return "Only the project owner can change sharing.";
  }
  if (error?.status === 404) {
    return "This project no longer exists.";
  }
  return error?.message || "Something went wrong. Try again.";
}

function SharingPrivacy() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [actionState, setActionState] = useState("idle"); // idle | sharing | unsharing | success | error
  const [actionError, setActionError] = useState("");
  const [confirmingUnshare, setConfirmingUnshare] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSharingPrivacy(projectId)
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load sharing and privacy:", error);
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  async function refreshData() {
    const result = await getSharingPrivacy(projectId);
    setData(result);
  }

  async function handleShare() {
    setActionError("");
    setActionState("sharing");
    try {
      await shareProject(projectId);
      await refreshData();
      setActionState("success");
    } catch (error) {
      console.error("Failed to share project:", error);
      setActionError(actionErrorMessage(error));
      setActionState("error");
    }
  }

  async function handleUnshare() {
    setActionError("");
    setActionState("unsharing");
    try {
      await unshareProject(projectId);
      await refreshData();
      setConfirmingUnshare(false);
      setActionState("success");
    } catch (error) {
      console.error("Failed to unshare project:", error);
      setActionError(actionErrorMessage(error));
      setActionState("error");
    }
  }

  if (status === "loading") {
    return (
      <div className={styles.page} aria-busy="true">
        <h2 className={shared.title}>Sharing and privacy</h2>
        <p className={shared.description}>Loading your sharing settings...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.page}>
        <h2 className={shared.title}>Sharing and privacy</h2>
        <Alert variant="error" title="Sharing settings could not load">
          We could not load your settings. Check your connection and try again.
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const { user, project, team, sharing, isShared, isOwner } = data;
  const isBusy = actionState === "sharing" || actionState === "unsharing";

  // Empty state: the project is not completed yet
  if (project.status !== "Completed") {
    return (
      <div className={styles.page}>
        <h2 className={shared.title}>Sharing and privacy</h2>
        <div className={shared.card}>
          <Notice tone="info" title="No project evidence page to share">
            {project.title} is still {project.status}. No share link or profile
            entry has been created.
          </Notice>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            View project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={shared.title}>Sharing and privacy</h2>
      <p className={shared.description}>
        {[project.completedOn, project.dates].filter(Boolean).join(" · ")}
      </p>

      <Notice tone="info" title={isShared ? "Shared page" : "Private by default"}>
        Saved: {sharing.savedVisibility} page · Profile display Off.
        {isShared
          ? " Visible to every signed-in user and listed in Discover."
          : " Not listed in Discover."}
      </Notice>

      <div className={styles.columns}>
        <div className={styles.column}>
          {/* Team page sharing */}
          <section className={shared.card}>
            <h2 className={shared.cardTitle}>Team page sharing</h2>

            <p className={`${shared.text} ${styles.strongText}`}>
              {sharing.savedVisibility} (saved) ·{" "}
              {isShared ? "VISIBLE TO SIGNED-IN USERS" : "PRIVATE"}
            </p>

            {actionState === "error" && (
              <div className={styles.innerCard}>
                <Alert variant="error" title="Sharing did not update">
                  {actionError}
                </Alert>
              </div>
            )}

            {actionState === "success" && (
              <div className={styles.innerCard}>
                <Alert
                  variant="success"
                  title={isShared ? "Sharing activated" : "Sharing turned off"}
                >
                  {isShared
                    ? "The page is visible to every signed-in user and listed in Discover and recommendations."
                    : "The page is private to the team again. Members who already joined keep full access."}
                </Alert>
              </div>
            )}

            {isOwner ? (
              isShared ? (
                <>
                  <p className={shared.text}>
                    This page is listed in Discover and shown in recommendations
                    to signed-in users. Members keep full access.
                  </p>
                  {confirmingUnshare ? (
                    <>
                      <div className={styles.innerCard}>
                        <p className={shared.text}>
                          Unsharing hides the page from Discover and
                          recommendations. Members who already joined keep full
                          access.
                        </p>
                      </div>
                      <div className={shared.stack}>
                        <Button
                          fullWidth
                          variant="danger"
                          loading={actionState === "unsharing"}
                          loadingText="Unsharing..."
                          disabled={isBusy && actionState !== "unsharing"}
                          onClick={handleUnshare}
                        >
                          Confirm unshare
                        </Button>
                        <Button
                          fullWidth
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => setConfirmingUnshare(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={shared.helper}>
                        Unsharing hides the page from Discover and
                        recommendations. Members who already joined keep full
                        access.
                      </p>
                      <Button
                        fullWidth
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => {
                          setActionError("");
                          setActionState("idle");
                          setConfirmingUnshare(true);
                        }}
                      >
                        Unshare
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className={shared.text}>
                    Only accepted teammates can view this page. Sharing makes it
                    visible to every signed-in user and lists it in Discover and
                    recommendations.
                  </p>
                  <Button
                    fullWidth
                    loading={actionState === "sharing"}
                    loadingText="Activating sharing..."
                    disabled={isBusy && actionState !== "sharing"}
                    onClick={handleShare}
                  >
                    Activate sharing
                  </Button>
                </>
              )
            ) : (
              <>
                <p className={shared.text}>
                  {isShared
                    ? "This page is shared with every signed-in user and appears in Discover and recommendations."
                    : "Only accepted teammates can view this page."}
                </p>
                <p className={shared.helper}>
                  Only the project owner can change sharing.
                </p>
              </>
            )}
          </section>

          {/* Saved page view */}
          <section className={shared.card}>
            <h2 className={shared.cardTitle}>
              {isShared ? "Saved shared view" : "Saved team-only view"}
            </h2>
            <p className={`${shared.text} ${styles.strongText}`}>
              {project.title}
            </p>
            <p className={shared.text}>
              {[project.status, isShared ? "SHARED" : "PRIVATE", project.completedOn]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className={shared.text}>{project.summary}</p>
            <ul className={shared.list}>
              {team.map((member) => (
                <li key={member.name}>
                  {member.name} · {member.role}
                </li>
              ))}
            </ul>
            <p className={shared.text}>
              Outcome, individual task evidence and project deliverable.
            </p>
            <p className={shared.helper}>
              Contacts, private task comments and drafts are excluded.
            </p>
          </section>
        </div>

        <div className={styles.column}>
          {/* Independent choice / your profile */}
          <section className={shared.card}>
            <h2 className={shared.cardTitle}>
              Independent choice / your profile
            </h2>

            <div className={styles.innerCard}>
              <h3 className={shared.cardTitle}>
                Your profile · {user.name}
              </h3>

              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={false} disabled />
                <span>Display on my profile</span>
              </label>

              <p className={shared.helper}>Not available yet.</p>

              <Button fullWidth disabled>
                Save own profile choice
              </Button>
            </div>

            <p className={shared.text}>
              Completion does not display projects automatically. Profile
              display does not change team-page sharing.
            </p>
          </section>

          {/* Current audience */}
          <section className={shared.card}>
            <h2 className={shared.cardTitle}>Current audience</h2>
            <p className={`${shared.text} ${styles.strongText}`}>
              {sharing.savedVisibility} · saved audience
            </p>
            <p className={shared.text}>
              {isShared
                ? "Every signed-in user can view this page. It is listed in Discover and recommendations."
                : "Accepted team access only. The page is not listed in Discover."}
            </p>
            <p className={shared.helper}>
              {isShared
                ? "Unsharing hides the page from Discover and recommendations. Members who already joined keep full access."
                : "Only the project owner can change sharing."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SharingPrivacy;
