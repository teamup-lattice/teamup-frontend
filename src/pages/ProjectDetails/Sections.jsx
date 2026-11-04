import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Select from "../../components/Select";
import {
  capitalize,
  countWord,
  joinWithAnd,
  ownerLine,
  unavailableMessage,
} from "./projectDetailsHelpers";
import styles from "./ProjectDetails.module.css";

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{children}</dd>
    </div>
  );
}

// The Select component always adds a first "Select a role" option, so an
// empty value is ignored by the page.
export function RoleSelect({
  label,
  roles,
  value,
  onChange,
  helperText,
  selectRef,
}) {
  return (
    <Select
      ref={selectRef}
      label={label}
      placeholder="Select a role"
      options={roles.map((role) => ({ value: role.id, label: role.title }))}
      value={value}
      onChange={onChange}
      helperText={helperText}
    />
  );
}

export function OverviewCard({ project }) {
  return (
    <section className={styles.card} aria-labelledby="project-title">
      <h2 className={styles.cardTitle} id="project-title">
        {project.title}
      </h2>
      <p className={styles.meta}>
        {project.type} · {project.recruitmentStatus}
      </p>
      <dl className={styles.fieldList}>
        <Field label="Problem">{project.problem}</Field>
        <Field label="Description">{project.description}</Field>
        <Field label="Expected outcome">{project.expectedOutcome}</Field>
        <Field label="Project skills">{project.skills.join(" · ")}</Field>
      </dl>
      <div className={styles.owner}>
        <span className={styles.avatar} aria-hidden="true">
          {project.owner.name.charAt(0)}
        </span>
        <span className={styles.meta}>{ownerLine(project.owner)}</span>
      </div>
      <p className={styles.helper}>
        Contact details are only visible to accepted teammates.
      </p>
    </section>
  );
}

export function TeamCard({
  project,
  roles,
  selectedRoleId,
  onRoleChange,
  selectRef,
}) {
  const joined = project.collaboratorsJoined;
  const openRoles = `${capitalize(countWord(roles.length))} open ${
    roles.length === 1 ? "role" : "roles"
  }: ${joinWithAnd(roles.map((role) => role.title))}.`;
  const joinedText =
    joined === 0
      ? "No collaborators have joined yet."
      : `${capitalize(countWord(joined))} ${
          joined === 1 ? "collaborator has" : "collaborators have"
        } joined.`;
  const otherRoles = roles
    .filter((role) => role.id !== selectedRoleId)
    .map((role) => role.title);

  return (
    <section className={styles.card} aria-labelledby="team-title">
      <h2 className={styles.cardTitle} id="team-title">
        {`A team of ${countWord(project.plannedTeamSize)}`}
      </h2>
      <p className={styles.meta}>{ownerLine(project.owner)}</p>
      <p className={styles.bodyText}>
        {openRoles} {joinedText}
      </p>
      <RoleSelect
        label="Role to review"
        roles={roles}
        value={selectedRoleId}
        onChange={onRoleChange}
        selectRef={selectRef}
        helperText={
          otherRoles.length > 0
            ? `Also available to review: ${otherRoles.join(", ")}`
            : undefined
        }
      />
    </section>
  );
}

export function RoleTermsCard({ role }) {
  return (
    <section className={styles.card} aria-labelledby="role-title">
      <h2 className={styles.cardTitle} id="role-title">
        Your role and expected contribution
      </h2>
      <p className={styles.strong}>{role.title}</p>
      <p className={styles.bodyText}>{role.summary}</p>
      <dl className={styles.fieldList}>
        <Field label="Required skills">{role.skills.join(" · ")}</Field>
        <Field label="Expected contribution">{role.expectedContribution}</Field>
      </dl>
      <p className={styles.strong}>
        {role.hoursPerWeek} h / week · {role.weeks} weeks
      </p>
      <p className={styles.meta}>
        Start: {role.start}
        <br />
        End: {role.end}
      </p>
      <dl className={styles.fieldList}>
        <Field label="Availability expectations">{role.availability}</Field>
      </dl>
    </section>
  );
}

export function MilestonesCard({ milestones, taskDeadlines }) {
  return (
    <section className={styles.card} aria-labelledby="milestones-title">
      <h2 className={styles.cardTitle} id="milestones-title">
        Planned milestones and deadlines
      </h2>
      <ul className={styles.plainList}>
        {milestones.map((milestone) => (
          <li key={milestone.label}>
            {milestone.label} — {milestone.date}
          </li>
        ))}
      </ul>
      <p className={styles.fieldLabel}>Your planned task deadlines</p>
      <ul className={styles.plainList}>
        {taskDeadlines.map((task) => (
          <li key={task.label}>
            {task.label} — {task.date}
          </li>
        ))}
      </ul>
    </section>
  );
}

function UnavailableRequest({ role, profile, buttonLabel }) {
  return (
    <div>
      <Alert variant="info" title={`Request unavailable for ${profile.name}`}>
        {unavailableMessage(role, profile)}
      </Alert>
      <Button fullWidth disabled>
        {buttonLabel}
      </Button>
    </div>
  );
}

// A role that is not the one currently selected, shown for information.
export function OtherRoleCard({ role, profile }) {
  const titleId = `role-${role.id}-title`;

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 className={styles.cardTitle} id={titleId}>
        {role.title} / informational
      </h2>
      <p className={styles.bodyText}>{role.summary}</p>
      <p className={styles.bodyText}>
        Required skills: {role.skills.join(" · ")}
      </p>
      <p className={styles.strong}>
        {role.hoursPerWeek} h / week · {role.weeks} weeks
      </p>
      {!role.eligibility.isEligible && (
        <UnavailableRequest
          role={role}
          profile={profile}
          buttonLabel={`Request ${role.shortName} role`}
        />
      )}
    </section>
  );
}

export function AgreementsCard({ agreements, proposal }) {
  return (
    <section className={styles.card} aria-labelledby="agreements-title">
      <h2 className={styles.cardTitle} id="agreements-title">
        Team agreements
      </h2>
      <ul className={styles.bulletList}>
        {agreements.map((agreement) => (
          <li key={agreement}>{agreement}</li>
        ))}
      </ul>
      <dl className={styles.fieldList}>
        <Field label="Response-window proposal">{proposal}</Field>
      </dl>
      <p className={styles.helper}>Response window: to be agreed</p>
    </section>
  );
}

export function RequestCard({ project, role, profile, onRequest }) {
  return (
    <section className={styles.card} aria-labelledby="request-title">
      <h2 className={styles.cardTitle} id="request-title">
        Selected role: {role.title}
      </h2>
      {role.eligibility.isEligible ? (
        <>
          <p className={styles.bodyText}>
            Stated requirements met: {role.skills.join(", ")},{" "}
            {role.hoursPerWeek} h / week for {role.weeks} weeks.
          </p>
          <Button fullWidth onClick={onRequest}>
            Request selected role
          </Button>
          <p className={styles.helper}>
            {project.owner.name} reviews your request. Joining requires
            approval and saved commitment acceptance.
          </p>
        </>
      ) : (
        <UnavailableRequest
          role={role}
          profile={profile}
          buttonLabel="Request selected role"
        />
      )}
    </section>
  );
}