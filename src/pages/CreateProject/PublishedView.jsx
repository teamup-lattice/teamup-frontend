import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import listFilterIcon from "../../assets/list-filter.svg";
import publishImg from "../../assets/publish-img.png";
import { WizardContext } from "./WizardContextValue";
import { formatDate } from "./formatDate";
import styles from "./PublishedView.module.css";

function formatDuration(value) {
  const duration = String(value ?? "").trim();
  return /^\d+(?:\.\d+)?$/.test(duration) ? `${duration} weeks` : duration;
}

function formatHours(value) {
  return String(value ?? 0).replace(/\s*(?:hours?|h)\s*$/i, "").trim() || "0";
}

function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return start && end ? `${start} – ${end}` : start || end;
}

const numberWords = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

function PublishedView() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("PublishedView must be used within a WizardProvider.");
  }

  const {
    basics,
    roles,
    commitment,
    milestones,
    publishedProjectId,
    ownerName = "You",
  } = context;

  const navigate = useNavigate();

  const ownerRole = roles.roles?.find((r) => r.isOwner);
  const openRoles = roles.roles?.filter((r) => !r.isOwner) ?? [];
  const openRolesHeading = `${
    numberWords[openRoles.length] ?? openRoles.length
  } open role${openRoles.length === 1 ? "" : "s"}`;

  const plannedDates = formatDateRange(
    commitment.startDate,
    commitment.endDate,
  );
  const duration = formatDuration(commitment.duration);

  const handleFindCollaborators = () => {
    // Route /collaborators does not exist in App.jsx; navigate to /projects per spec fallback.
    navigate("/projects");
  };

  return (
    <div className={styles.container}>
      <img
        src={publishImg}
        alt="Rolled plans and colored blocks illustrating a new project"
        className={styles.publishedImage}
      />

      <div className={styles.headerSection}>
        <span className={styles.badge}>Open</span>
        <h1 className={styles.heading}>Your project is published</h1>
        <p className={styles.description}>
          Find collaborators for your open roles.
        </p>
      </div>

      <Alert
        variant="success"
        title={`${basics.name || "Your project"} is Open`}
      >
        Published. You are the Project Owner; no collaborators have joined.
      </Alert>

      <div className={styles.ownerRow}>
        <div className={styles.avatar}>
          {ownerName.charAt(0).toUpperCase()}
        </div>
        <span className={styles.ownerText}>
          {ownerName} · Owner / {ownerRole?.title || "Project Owner"}
        </span>
      </div>

      <article className={styles.card}>
        <span className={styles.badge}>Open</span>
        <h2 className={styles.cardTitle}>{basics.name}</h2>
        <p className={styles.bodyText}>{basics.problem}</p>
        <p className={styles.metaLine}>
          {duration} · planned {plannedDates}
        </p>
        <Button onClick={handleFindCollaborators}>Find collaborators</Button>
        <p className={styles.recruitmentNote}>
          Recruitment is open. No team has formed or started yet.
        </p>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Expected outcome</h2>
        <p className={styles.bodyText}>{basics.outcome}</p>
        <p className={styles.metaLine}>
          Planned duration: {duration} · {plannedDates}
        </p>
      </article>

      {openRoles.length > 0 && (
        <section className={styles.openRolesSection}>
          <h2 className={styles.sectionHeading}>{openRolesHeading}</h2>
          {openRoles.map((role) => (
            <article key={role.id} className={styles.openRoleCard}>
              <h3 className={styles.roleTitle}>{role.title}</h3>
              <p className={styles.roleSubtitle}>
                Unfilled ·{" "}
                {formatHours(commitment.hoursByRole?.[role.id])} h / week ·{" "}
                {duration}
              </p>
              <p className={styles.bodyText}>{role.responsibilities}</p>
              <p className={styles.roleSkills}>
                Required skills: {role.skills?.join(" · ")}
              </p>
            </article>
          ))}
        </section>
      )}

      {milestones.length > 0 && (
        <article className={`${styles.card} ${styles.milestonesCard}`}>
          <h2 className={styles.cardTitle}>Planned milestones</h2>
          {milestones.map((m) => (
            <div key={m.id} className={styles.milestoneRow}>
              <h3 className={styles.milestoneName}>{m.name}</h3>
              <p className={styles.milestoneDate}>{formatDate(m.date)}</p>
            </div>
          ))}
        </article>
      )}

      <div className={styles.emptyCard}>
        <img
          src={listFilterIcon}
          alt=""
          aria-hidden="true"
          className={styles.emptyCardIcon}
        />
        <h2 className={styles.cardTitle}>No invitations sent yet</h2>
        <p className={styles.description}>
          Find collaborators. Publishing does not invite or accept teammates
          automatically.
        </p>
        <Button onClick={handleFindCollaborators}>
          Find collaborators
        </Button>
      </div>

      <div className={styles.actions}>
        <AltLink to={publishedProjectId ? `/projects/${publishedProjectId}` : "/projects"}>
          View project details
        </AltLink>
      </div>
    </div>
  );
}

export default PublishedView;
