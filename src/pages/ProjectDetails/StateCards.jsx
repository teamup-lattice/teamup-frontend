import Alert from "../../components/Alert";
import Button from "../../components/Button";
import listFilterIcon from "../../assets/list-filter.svg";
import { RoleSelect } from "./Sections";
import styles from "./ProjectDetails.module.css";

export function LoadingCard({ project, role }) {
  return (
    <section className={styles.card} aria-busy="true">
      {project && role && (
        <p className={styles.meta}>
          {project.title} · {role.title}
        </p>
      )}
      <ul className={styles.skeletonList} aria-hidden="true">
        {Array.from({ length: 2 }, (_, index) => (
          <li className={styles.skeleton} key={index}>
            <span className={styles.barLong} />
            <span className={styles.barShort} />
            <span className={styles.barBlock} />
          </li>
        ))}
      </ul>
      <p className={styles.loadingRow} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        Loading role terms...
      </p>
      <Button fullWidth disabled>
        Request selected role
      </Button>
    </section>
  );
}

// Terms could not load. The chosen role stays selected.
export function ErrorCard({
  project,
  roles,
  selectedRoleId,
  onRoleChange,
  onRecheck,
  selectRef,
}) {
  return (
    <section className={styles.card}>
      {project && <h2 className={styles.cardTitle}>{project.title}</h2>}
      {project && (
        <RoleSelect
          label="Role to review"
          roles={roles}
          value={selectedRoleId}
          onChange={onRoleChange}
          selectRef={selectRef}
        />
      )}
      <div>
        <Alert variant="error" title="Complete terms could not load">
          Role selection retained. Recheck the project and eligibility before
          requesting.
        </Alert>
        <Button fullWidth onClick={onRecheck}>
          Recheck current project
        </Button>
      </div>
      <Button fullWidth disabled>
        Request selected role
      </Button>
    </section>
  );
}

export function ClosedRoleCard({
  project,
  roles,
  selectedRoleId,
  onRoleChange,
  onBack,
  selectRef,
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{project.title}</h2>
      <RoleSelect
        label="Selected role"
        roles={roles}
        value={selectedRoleId}
        onChange={onRoleChange}
        selectRef={selectRef}
      />
      <div className={styles.emptyPanel}>
        <img
          className={styles.emptyIcon}
          src={listFilterIcon}
          alt=""
          aria-hidden="true"
        />
        <h3 className={styles.emptyTitle}>This role is no longer open</h3>
        <p className={styles.emptyText}>
          Role unavailable. Choose another Open role.
        </p>
        <Button onClick={onBack}>Back to discovery</Button>
      </div>
      <Button fullWidth disabled>
        Request selected role
      </Button>
    </section>
  );
}

export function NotFoundCard() {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Project not found</h2>
      <p className={styles.bodyText}>
        This project may have been removed, or the link is incorrect.
      </p>
    </section>
  );
}
