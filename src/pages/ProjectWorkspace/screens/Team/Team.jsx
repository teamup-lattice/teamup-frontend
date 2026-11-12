import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Skeleton from "../../../../components/Skeleton";
import { useWorkspace } from "../../useWorkspace";
import styles from "./Team.module.css";

function Team() {
  const {
    isOwner,
    canManageMembers,
    members,
    project,
    workspaceLoading,
    workspaceError,
    membersLoading,
    membersError,
    retryWorkspace,
  } = useWorkspace();

  const [editingMember, setEditingMember] = useState(null);
  const [draftRole, setDraftRole] = useState("");
  const [draftResponsibilities, setDraftResponsibilities] = useState("");

  const resetEdit = () => {
    setEditingMember(null);
    setDraftRole("");
    setDraftResponsibilities("");
  };

  const openEdit = (member) => {
    setEditingMember(String(member.id));
    setDraftRole(member.role);
    setDraftResponsibilities("");
  };

  const confirmRoleSave = () => {
    setEditingMember(null);
  };

  if (workspaceLoading || membersLoading) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Team</h2>
        <p role="status">Loading team members…</p>
        <div className={styles.loadingList}>
          <Skeleton />
          <Skeleton />
        </div>
      </section>
    );
  }

  if (workspaceError || membersError) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Team</h2>
        <Alert variant="error" title="Couldn't load team members">
          {workspaceError || membersError}
        </Alert>
        <Button fullWidth onClick={retryWorkspace}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Team</h2>
      <p className={styles.subtitle}>{members.length} joined members</p>

      {members.length === 0 && (
        <EmptyState title="No active members" text="There are no active members to show." />
      )}

      {members.map((member) => {
        const isEditing = editingMember === String(member.id);
        const isMemberOwner =
          member.accessLevel === "OWNER" ||
          (project.ownerId != null &&
            String(member.userId) === String(project.ownerId));
        if (isEditing) {
          return (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberHeader}>
                <div className={styles.avatar}>{member.name.charAt(0)}</div>
                <div>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <p className={styles.memberRole}>Editing role</p>
                </div>
              </div>

              <Input label="Member" value={member.name} disabled />
              <Input
                label="Role"
                required
                value={draftRole}
                onChange={(event) => setDraftRole(event.target.value)}
              />
              <Input
                label="Responsibilities"
                required
                value={draftResponsibilities}
                onChange={(event) => setDraftResponsibilities(event.target.value)}
              />
              <p className={styles.metaLine}>
                Unsaved local role changes for {member.name}. Role editing is not connected to the backend.
              </p>
              <Button type="button" fullWidth onClick={confirmRoleSave}>Confirm role changes</Button>
              <Button type="button" variant="secondary" fullWidth onClick={resetEdit}>Cancel</Button>
            </div>
          );
        }

        return (
          <div key={member.id} className={styles.memberCard}>
            <div className={styles.memberHeader}>
              <div className={styles.avatar}>{member.name.charAt(0)}</div>
              <p className={styles.memberName}>{member.name} · {member.role}</p>
            </div>

            <p className={styles.memberRole}>{member.role}</p>
            <p className={styles.memberResponsibilities}>
              Access level: {member.accessLevel || "Not provided"}
            </p>
            <p className={styles.metaLine} id={`commitment-${member.id}`}>
              Joined {member.acceptedDate || "Date not provided"}
              {member.hoursPerWeek != null &&
                ` · ${member.hoursPerWeek} h / week`}
              {member.openTaskCount != null &&
                ` · ${member.openTaskCount} open tasks`}
            </p>
            <a className={styles.linkButton} href={`#commitment-${member.id}`}>
              View member summary
            </a>

            {isOwner && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => openEdit(member)}
                >
                  Edit role
                </Button>
              </>
            )}

            {canManageMembers && !isMemberOwner && (
              <Link
                className={styles.linkButton}
                to={`./release-role?member=${encodeURIComponent(member.id)}`}
              >
                Review release of {member.name}&apos;s role
              </Link>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default Team;
