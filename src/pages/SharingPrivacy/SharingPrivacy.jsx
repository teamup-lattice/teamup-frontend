import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import {
  getSharingPrivacy,
  saveProfileDisplay,
} from "../../services/sharingPrivacyService";
import styles from "./SharingPrivacy.module.css";

const TEAM_ONLY = "team";
const LINK_MODE = "link";

function Notice({ tone, title, children }) {
  return (
    <div
      className={tone === "success" ? styles.noticeSuccess : styles.notice}
      role="status"
    >
      <p className={styles.noticeTitle}>
        <span aria-hidden="true">{tone === "success" ? "✓ " : "ⓘ "}</span>
        {title}
      </p>
      <p className={styles.noticeText}>{children}</p>
    </div>
  );
}

function SharingPrivacy() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [teamChoice, setTeamChoice] = useState(TEAM_ONLY);
  const [savedDisplay, setSavedDisplay] = useState(false);
  const [localDisplay, setLocalDisplay] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | error | success

  useEffect(() => {
    let isMounted = true;

    getSharingPrivacy()
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setSavedDisplay(result.profile.displayOnProfile);
        setLocalDisplay(result.profile.displayOnProfile);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load sharing and privacy:", error);
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSaveProfileChoice() {
    setSaveState("saving");
    saveProfileDisplay(localDisplay)
      .then(() => {
        setSavedDisplay(localDisplay);
        setSaveState("success");
      })
      .catch((error) => {
        console.error("Failed to save profile choice:", error);
        setSaveState("error");
      });
  }

  function handleCancelLocalChanges() {
    setLocalDisplay(savedDisplay);
    setTeamChoice(TEAM_ONLY);
    setSaveState("idle");
  }

  if (status === "loading") {
    return (
      <div className={styles.page} aria-busy="true">
        <h1 className={styles.title}>Sharing and privacy</h1>
        <p className={styles.meta}>Loading your sharing settings...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Sharing and privacy</h1>
        <Alert variant="error" title="Sharing settings could not load">
          We could not load your settings. Check your connection and try again.
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const { user, project, sharing } = data;
  const others = project.team
    .filter((member) => member.name !== user.name)
    .map((member) => member.name)
    .join(" and ");
  const savedLabel = savedDisplay ? "On" : "Off";
  const localLabel = localDisplay ? "On" : "Off";
  const isLinkPreview = teamChoice === LINK_MODE;
  const isSaving = saveState === "saving";

  // Empty state: the project is not completed yet
  if (project.status !== "Completed") {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Sharing and privacy</h1>
        <div className={styles.card}>
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
      <h1 className={styles.title}>Sharing and privacy</h1>
      <p className={styles.meta}>
        {project.completedOn} · {project.dates}
      </p>

      <Notice tone="info" title="Private by default">
        Saved: {sharing.savedVisibility} page · Profile display {savedLabel}.
        Completion changes neither.
      </Notice>

      <div className={styles.columns}>
        <div className={styles.column}>
          {/* Team page sharing */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Team page sharing</h2>

            {isLinkPreview ? (
              <>
                <label className={styles.label} htmlFor="teamChoice">
                  Team page sharing choice
                </label>
                <select
                  id="teamChoice"
                  className={styles.select}
                  value={teamChoice}
                  onChange={(event) => setTeamChoice(event.target.value)}
                >
                  <option value={TEAM_ONLY}>Team-only</option>
                  <option value={LINK_MODE}>Link mode · LOCAL PREVIEW</option>
                </select>
                <p className={styles.strongText}>
                  Saved visibility: {sharing.savedVisibility}
                </p>
                <p className={styles.text}>
                  Preview includes outcome, named roles, individual task
                  evidence and marketplace-prototype.zip only. No contacts,
                  private comments or drafts.
                </p>
                <div className={styles.buttonStack}>
                  <Button fullWidth disabled>
                    Activate sharing
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setTeamChoice(TEAM_ONLY)}
                  >
                    Cancel preview
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.strongText}>
                  {sharing.savedVisibility} (saved) · PRIVATE
                </p>
                <label className={styles.label} htmlFor="teamChoice">
                  Team page sharing choice
                </label>
                <select
                  id="teamChoice"
                  className={styles.select}
                  value={teamChoice}
                  onChange={(event) => setTeamChoice(event.target.value)}
                >
                  <option value={TEAM_ONLY}>Team-only</option>
                  <option value={LINK_MODE}>Link mode · LOCAL PREVIEW</option>
                </select>
                <p className={styles.text}>
                  Only accepted teammates can view the saved page.
                </p>
                <div className={styles.buttonStack}>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setTeamChoice(LINK_MODE)}
                  >
                    Preview link mode
                  </Button>
                  <Button fullWidth disabled>
                    Activate sharing
                  </Button>
                </div>
                <p className={styles.helper}>
                  Link mode: preview only. Sharing unavailable pending policy
                  approval.
                </p>
              </>
            )}
          </section>

          {/* Saved team-only view */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Saved team-only view</h2>
            <p className={styles.strongText}>{project.title}</p>
            <p className={styles.text}>
              {project.status} · PRIVATE · {project.completedOn}
            </p>
            <p className={styles.summary}>{project.summary}</p>
            <ul className={styles.teamList}>
              {project.team.map((member) => (
                <li key={member.name}>
                  {member.name} · {member.role}
                </li>
              ))}
            </ul>
            <p className={styles.text}>
              Outcome, individual task evidence and project deliverable.
            </p>
            <p className={styles.helper}>
              Contacts, private task comments and drafts are excluded.
            </p>
          </section>
        </div>

        <div className={styles.column}>
          {/* Independent choice / your profile */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Independent choice / your profile</h2>

            <div className={styles.innerCard}>
              <h3 className={styles.innerTitle}>Your profile · {user.name}</h3>

              {saveState === "success" ? (
                <>
                  <Notice tone="success" title={`${user.name}'s profile choice saved`}>
                    Displayed on {user.name}&apos;s profile. {others} unchanged;
                    team page stays {sharing.savedVisibility}.
                  </Notice>
                  <p className={styles.text}>
                    {savedLabel} (saved) · {user.name} only
                  </p>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    Back to private project page
                  </Button>
                </>
              ) : (
                <>
                  {saveState === "error" && (
                    <Alert variant="error" title="Profile choice did not save">
                      {user.name}&apos;s local selection is retained; saved
                      profile remains {savedLabel}. Saved team page remains{" "}
                      {sharing.savedVisibility}.
                    </Alert>
                  )}

                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={localDisplay}
                      disabled={isSaving}
                      onChange={(event) => {
                        setLocalDisplay(event.target.checked);
                        if (saveState === "error") setSaveState("idle");
                      }}
                    />
                    <span>Display on my profile</span>
                  </label>

                  <p className={styles.helper}>
                    {localDisplay !== savedDisplay
                      ? `${localLabel} selected locally · ${savedLabel} still saved`
                      : `${savedLabel} (saved) · ${
                          savedDisplay
                            ? "Displayed on your profile."
                            : "Not displayed on your profile."
                        }`}
                  </p>

                  {isSaving ? (
                    <p className={styles.savingBox} role="status">
                      <span aria-hidden="true">⟳ </span>Saving profile choice...
                    </p>
                  ) : (
                    <Button
                      fullWidth
                      onClick={handleSaveProfileChoice}
                    >
                      {saveState === "error"
                        ? "Retry own profile save"
                        : "Save own profile choice"}
                    </Button>
                  )}

                  <p className={styles.helper}>
                    {isSaving
                      ? `${sharing.savedVisibility} remains saved. ${others} are unchanged.`
                      : `Changes your profile only. ${others} and team-page sharing are unaffected.`}
                  </p>
                </>
              )}
            </div>

            <p className={styles.text}>
              Completion does not display projects automatically. Profile
              display does not share the team page.
            </p>
            <p className={styles.helper}>
              Cancel local choices leaves saved {savedLabel} and{" "}
              {sharing.savedVisibility} unchanged. Your choice never changes
              another person&apos;s profile.
            </p>
            <button
              type="button"
              className={styles.linkButton}
              onClick={handleCancelLocalChanges}
              disabled={isSaving}
            >
              Cancel local changes
            </button>
          </section>

          {/* Preview comparison */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Preview comparison</h2>
            <p className={styles.strongText}>
              {sharing.savedVisibility} · saved audience
            </p>
            <p className={styles.text}>
              Accepted team access only. No share link.
            </p>
            <p className={styles.strongText}>
              Chosen link mode · LOCAL PREVIEW
            </p>
            <p className={styles.text}>
              Evidence preview only; not live, not published. No URL is created.
            </p>
            <p className={styles.helper}>
              Audience, consent and authenticated-access exceptions are not yet
              defined.
            </p>
            <Button fullWidth disabled>
              Activate link mode
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SharingPrivacy;