import Button from "../../components/Button";
import Select from "../../components/Select";
import { formatDate } from "../../services/discoverService";
import {
  capitalize,
  countWord,
  joinWithAnd,
  ownerLine,
  skillNames,
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
        {project.projectType} · {project.status}
      </p>
      <dl className={styles.fieldList}>
        <Field label="Problem">{project.problem}</Field>
        <Field label="Description">{project.description}</Field>
        <Field label="Expected outcome">{project.outcome}</Field>
        <Field label="Project skills">
          {skillNames(project.skills).join(" · ")}
        </Field>
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
  membersCount,
  selectedRoleId,
  onRoleChange,
  selectRef,
}) {
  const joined = membersCount;
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
        {`A team of ${countWord(project.teamSize)}`}
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

export function RoleTermsCard({ role, project }) {
  const start = formatDate(project.startDate);
  const end = formatDate(project.targetEndDate);

  return (
    <section className={styles.card} aria-labelledby="role-title">
      <h2 className={styles.cardTitle} id="role-title">
        Your role and expected contribution
      </h2>
      <p className={styles.strong}>{role.title}</p>
      <p className={styles.bodyText}>{role.description}</p>
      <dl className={styles.fieldList}>
        <Field label="Required skills">
          {skillNames(role.skills).join(" · ")}
        </Field>
      </dl>
      <p className={styles.strong}>
        {role.hoursPerWeek} h / week
        {project.durationWeeks ? ` · ${project.durationWeeks} weeks` : ""}
      </p>
      {(start || end) && (
        <p className={styles.meta}>
          {start && <>Start: {start}</>}
          {start && end && <br />}
          {end && <>End: {end}</>}
        </p>
      )}
    </section>
  );
}

export function MilestonesCard({ milestones = [] }) {
  if (milestones.length === 0) return null;

  return (
    <section className={styles.card} aria-labelledby="milestones-title">
      <h2 className={styles.cardTitle} id="milestones-title">
        Planned milestones and deadlines
      </h2>
      <ul className={styles.plainList}>
        {milestones.map((milestone) => {
          const dueDate = formatDate(milestone.dueDate);
          if (!dueDate) return null;
          return (
            <li key={milestone.id}>
              {milestone.title} — {dueDate}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// A role that is not the one currently selected, shown for information.
export function OtherRoleCard({ role, project }) {
  const titleId = `role-${role.id}-title`;

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 className={styles.cardTitle} id={titleId}>
        {role.title} / informational
      </h2>
      <p className={styles.bodyText}>{role.description}</p>
      <p className={styles.bodyText}>
        Required skills: {skillNames(role.skills).join(" · ")}
      </p>
      <p className={styles.strong}>
        {role.hoursPerWeek} h / week
        {project.durationWeeks ? ` · ${project.durationWeeks} weeks` : ""}
      </p>
    </section>
  );
}

export function RequestCard({ project, role, onRequest }) {
  return (
    <section className={styles.card} aria-labelledby="request-title">
      <h2 className={styles.cardTitle} id="request-title">
        Selected role: {role.title}
      </h2>
      <p className={styles.bodyText}>
        Stated requirements: {skillNames(role.skills).join(", ")},{" "}
        {role.hoursPerWeek} h / week.
      </p>
      <Button fullWidth onClick={onRequest}>
        Request selected role
      </Button>
      <p className={styles.helper}>
        {project.owner.name} reviews your request. Joining requires approval
        and saved commitment acceptance.
      </p>
    </section>
  );
}