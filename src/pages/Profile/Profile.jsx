import { useEffect, useRef, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { NO_VISIBILITY } from "../../data/profileData";
import { getProfile } from "../../services/profileService";
import { saveVisibility } from "../../services/visibilityService";
import {
  CompletedProjectsCard,
  ContactCard,
  DiscoveryCard,
  ProfileDetailsCard,
} from "./ProfileCards";
import VisibilityCard from "./VisibilityCard";
import styles from "./Profile.module.css";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saved, setSaved] = useState(NO_VISIBILITY);
  const [draft, setDraft] = useState(NO_VISIBILITY);
  const [status, setStatus] = useState("idle"); // idle | saving | error | saved
  const errorRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((result) => {
        if (!isMounted) return;
        const visibility = { ...NO_VISIBILITY, ...result.visibilitySettings };
        setProfile(result);
        setSaved(visibility);
        setDraft(visibility);
        setLoadStatus("ready");
      })
      .catch(() => {
        if (isMounted) setLoadStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  function handleToggle(key) {
    setDraft((current) => ({ ...current, [key]: !current[key] }));
    if (status === "saved") setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    try {
      await saveVisibility(draft);
      setSaved(draft);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (loadStatus === "loading") {
    return <p role="status">Loading your profile…</p>;
  }

  if (loadStatus === "error") {
    return (
      <>
        <Alert variant="error" title="Couldn't load your profile">
          Please try again.
        </Alert>
        <Button
          onClick={() => {
            setLoadStatus("loading");
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          Retry
        </Button>
      </>
    );
  }

  const project = profile.completedProjects[0] ?? null;

  return (
    <div>
      <h1 className={styles.title}>Profile and privacy</h1>
      <p className={styles.description}>Choose what is public.</p>

      <div className={styles.columns}>
        <div className={styles.column}>
          <ProfileDetailsCard profile={profile} />
          <ContactCard profile={profile} />
          <DiscoveryCard />
          <CompletedProjectsCard
            project={project}
            shownOnProfile={saved.showProject}
          />
        </div>
        <div className={styles.column}>
          <VisibilityCard
            profile={profile}
            project={project}
            saved={saved}
            draft={draft}
            status={status}
            onToggle={handleToggle}
            onSave={handleSave}
            errorRef={errorRef}
          />
        </div>
      </div>
    </div>
  );
}

export default Profile;
