import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import styles from "./ProfileCards.module.css";

export function ProfileDetailsCard({ profile }) {
  const name = profile.name ?? "";

  return (
    <Card aria-labelledby="details-title">
      <div className={styles.person}>
        <span className={styles.avatar} aria-hidden="true">
          {name.charAt(0)}
        </span>
        <span className={styles.personText}>
          {[name, profile.role].filter(Boolean).join(" · ")}
        </span>
      </div>
      <h2 id="details-title" className={styles.title}>
        Your profile details
      </h2>
      {profile.skills.length > 0 && (
        <p className={styles.body}>{profile.skills.join(" · ")}</p>
      )}
      {profile.skillLevel && (
        <p className={styles.small}>
          Skill level: {profile.skillLevel} · self-reported
        </p>
      )}
      {profile.goals && <p className={styles.body}>{profile.goals}</p>}
      {profile.availabilityHours != null && (
        <p className={styles.small}>
          Availability: {profile.availabilityHours} hours/week
        </p>
      )}
      {profile.durationWeeks != null && (
        <p className={styles.small}>
          Preferred duration: {profile.durationWeeks} weeks
        </p>
      )}
    </Card>
  );
}

export function ContactCard({ profile }) {
  return (
    <Card aria-labelledby="contact-title">
      <h2 id="contact-title" className={styles.title}>
        Contact details
      </h2>
      {profile.email && <p className={styles.body}>{profile.email}</p>}
      <p className={styles.helper}>
        Contact details: accepted teammates only, not visitors or pending invitees.
      </p>
    </Card>
  );
}

export function DiscoveryCard() {
  return (
    <Card aria-labelledby="discovery-title">
      <h2 id="discovery-title" className={styles.title}>
        Discovery preferences
      </h2>
      <p className={styles.body}>Not yet provided</p>
      <p className={styles.helper}>
        Interests and collaboration preferences are asked when you first discover
        projects.
      </p>
    </Card>
  );
}

export function CompletedProjectsCard({ project, shownOnProfile }) {
  const navigate = useNavigate();

  if (!project) {
    return (
      <Card aria-labelledby="completed-title">
        <h2 id="completed-title" className={styles.title}>
          Completed projects
        </h2>
        <div className={styles.empty}>
          <svg
            className={styles.emptyIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          <h3 className={styles.emptyTitle}>No completed projects yet</h3>
          <p className={styles.body}>Continue your work or discover a project.</p>
          <div className={styles.emptyAction}>
            <Button onClick={() => navigate("/discover")}>Discover Projects</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card aria-labelledby="completed-title">
      <h2 id="completed-title" className={styles.title}>
        Completed projects
      </h2>
      <p className={styles.small}>Completed {project.completedOn}</p>
      <h3 className={styles.projectTitle}>{project.title}</h3>
      <p className={styles.body}>{project.roleAndDates}</p>
      <p className={styles.body}>Contribution: {project.contribution}</p>
      <p className={styles.helper}>
        {shownOnProfile ? "Shown on your profile" : "Private on your profile"} ·
        Team-page sharing unchanged
      </p>
      <Button fullWidth variant="secondary" onClick={() => navigate(project.pageTo)}>
        View private project page
      </Button>
    </Card>
  );
}
