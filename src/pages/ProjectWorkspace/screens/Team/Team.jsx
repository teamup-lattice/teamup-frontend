import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Skeleton from "../../../../components/Skeleton";
import Textarea from "../../../../components/Textarea";
import { leaveWorkspaceProject } from "../../../../services/workspaceMembersService";
import { useWorkspace } from "../../useWorkspace";
import styles from "./Team.module.css";

function Team() {
  const {
    isOwner,
    canManageMembers,
    members,
    project,
    currentUser,
    workspaceLoading,
    workspaceError,
    membersLoading,
    membersError,
    retryWorkspace,
  } = useWorkspace();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [editingMember, setEditingMember] = useState(null);
  const [draftRole, setDraftRole] = useState("");
  const [draftResponsibilities, setDraftResponsibilities] = useState("");

  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  const handleLeaveProject = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    setLeaveError("");
    try {
      await leaveWorkspaceProject(projectId, { reason: leaveReason });
      navigate("/projects");
    } catch (error) {
      let message = error.message || "Failed to leave project.";
      if (error.status === 404) {
        message =
          "Project or membership not found. You may have already been removed.";
      } else if (error.status === 409) {
        message = "The project owner cannot leave the project.";
      }
      setLeaveError(message);
      setIsLeaving(false);
    }
  };

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
        const isCurrentUser =
          Boolean(currentUser?.id) &&
          String(member.userId) === String(currentUser.id);
        if (isEditing) {
          return (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberHeader}>
                <div className={styles.avatar}>{(member.name || "?").charAt(0)}</div>
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
              <div className={styles.avatar}>{(member.name || "?").charAt(0)}</div>
              <p className={styles.memberName}>
                {member.name}
                {member.role ? ` · ${member.role}` : ""}
              </p>
            </div>

            {member.role && <p className={styles.memberRole}>{member.role}</p>}
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

            {isCurrentUser && !isMemberOwner && !isOwner && (
              <div style={{ marginTop: "8px" }}>
                {isConfirmingLeave ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "16px",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "8px",
                      background: "var(--color-card)",
                    }}
                  >
                    <Alert variant="warning" title="Leave project?">
                      You will be removed from this project and your active tasks will be unassigned.
                    </Alert>
                    {leaveError && (
                      <Alert variant="error" title="Couldn't leave project">
                        {leaveError}
                      </Alert>
                    )}
                    <Textarea
                      label="Reason for leaving (optional)"
                      placeholder="Add an optional reason (max 500 characters)"
                      value={leaveReason}
                      maxLength={500}
                      helperText={`${500 - leaveReason.length} characters left`}
                      onChange={(event) => setLeaveReason(event.target.value)}
                      disabled={isLeaving}
                    />
                    <div style={{ display: "flex", gap: "12px" }}>
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                          setIsConfirmingLeave(false);
                          setLeaveReason("");
                          setLeaveError("");
                        }}
                        disabled={isLeaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        fullWidth
                        onClick={handleLeaveProject}
                        loading={isLeaving}
                        loadingText="Leaving…"
                      >
                        Confirm leave
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    fullWidth
                    onClick={() => {
                      setIsConfirmingLeave(true);
                      setLeaveError("");
                    }}
                  >
                    Leave project
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default Team;
