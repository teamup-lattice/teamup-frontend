import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import styles from "./ProfileCards.module.css";

export function ProfileDetailsCard({ profile }) {
  const name = profile.name ?? "";

  return (
    <Card aria-labelledby="details-title">
      <div className={styles.person}>
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className={styles.avatarImg}
          />
        ) : (
          <span className={styles.avatar} aria-hidden="true">
            {name.charAt(0)}
          </span>
        )}
        <span className={styles.personText}>
          {name && <span className={styles.personName}>{name}</span>}
          {profile.role && (
            <span className={styles.personRole}>{profile.role}</span>
          )}
        </span>
      </div>
      <h2 id="details-title" className={styles.title}>
        Your profile details
      </h2>
      {profile.skills.length > 0 && (
        <p className={styles.skills}>
          <strong className={styles.detailLabel}>Skills:</strong>{" "}
          {profile.skills.join(" · ")}
        </p>
      )}
      {profile.skillLevel && (
        <p className={styles.detail}>
          <strong className={styles.detailLabel}>Skill level:</strong>{" "}
          {profile.skillLevel}{" "}
          <span className={styles.note}>(self-reported)</span>
        </p>
      )}
      {profile.goals && (
        <p className={styles.body}>
          <strong className={styles.detailLabel}>Goal:</strong>{" "}
          {profile.goals}
        </p>
      )}
      {profile.availabilityHours != null && (
        <p className={styles.detail}>
          <strong className={styles.detailLabel}>Availability:</strong>{" "}
          {profile.availabilityHours} hours/week
        </p>
      )}
      {profile.durationWeeks != null && (
        <p className={styles.detail}>
          <strong className={styles.detailLabel}>Preferred duration:</strong>{" "}
          {profile.durationWeeks} weeks
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
      {project.completedOn && (
        <p className={styles.small}>Completed {project.completedOn}</p>
      )}
      {project.title && <h3 className={styles.projectTitle}>{project.title}</h3>}
      {project.roleAndDates && <p className={styles.body}>{project.roleAndDates}</p>}
      {project.contribution && (
        <p className={styles.body}>Contribution: {project.contribution}</p>
      )}
      {/* GAP: showProject has no backend field; this line stays local. */}
      <p className={styles.helper}>
        {shownOnProfile ? "Shown on your profile" : "Private on your profile"} ·
        Team-page sharing unchanged
      </p>
      {project.pageTo && (
        <Button fullWidth variant="secondary" onClick={() => navigate(project.pageTo)}>
          View private project page
        </Button>
      )}
    </Card>
  );
}
