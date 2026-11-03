import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NO_VISIBILITY, profile } from "../../data/profileData";
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
  const [params] = useSearchParams();
  // Dev-only switches for reviewing states: ?simulate=fail or ?simulate=empty
  const simulate = import.meta.env.DEV ? params.get("simulate") : null;
  const project = simulate === "empty" ? null : profile.completedProjects[0];

  const [saved, setSaved] = useState(NO_VISIBILITY);
  const [draft, setDraft] = useState(NO_VISIBILITY);
  const [status, setStatus] = useState("idle"); // idle | saving | error | saved
  const errorRef = useRef(null);

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
      await saveVisibility(draft, { simulateFail: simulate === "fail" });
      setSaved(draft);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

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
