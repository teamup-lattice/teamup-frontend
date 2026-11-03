import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Skeleton from "../../../../components/Skeleton";
import { members } from "../../../../data/workspaceData";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import styles from "./Team.module.css";

const memberResponsibilities = {
  Ada: "User stories and prototype review",
  David: "Design onboarding, UI handoff and responsive layout review",
  John: "Auth screens, discovery and prototype build",
};

function Team() {
  const { currentUser, isOwner } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const previewState = searchParams.get("state");

  const [editingMember, setEditingMember] = useState(null);
  const [draftRole, setDraftRole] = useState("");
  const [draftResponsibilities, setDraftResponsibilities] = useState("");

  const resetEdit = () => {
    setEditingMember(null);
    setDraftRole("");
    setDraftResponsibilities("");
  };

  const openEdit = (member) => {
    setEditingMember(member.name);
    setDraftRole(member.role);
    setDraftResponsibilities(memberResponsibilities[member.name] || "");
  };

  const confirmRoleSave = () => {
    setEditingMember(null);
  };

  if (previewState === "loading") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Team</h2>
        <p className={styles.subtitle}>3 joined members · Saved acceptance: 19 Oct 2026</p>
        <div className={styles.loadingList}>
          <Skeleton />
          <Skeleton />
        </div>
      </section>
    );
  }

  if (previewState === "roleopen") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Team</h2>
        <StateNotice
          variant="info"
          title="UI/UX Designer · Open"
          text="No accepted member fills this role. Existing work is preserved."
          buttonLabel="View team"
          onButtonClick={() => navigate(location.pathname + (location.search ? "" : ""))}
        />
      </section>
    );
  }

  if (previewState === "error") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Team</h2>
        <StateNotice
          variant="error"
          title="Role changes did not save"
          text="David remains UI/UX Designer. Responsibilities and 6 h/week are unchanged. Your local edit is retained."
          buttonLabel="Retry save"
          onButtonClick={() => navigate(location.pathname)}
        />
      </section>
    );
  }

  if (previewState === "saved") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Team</h2>
        <StateNotice
          variant="success"
          title="Role changes saved"
          text="David's responsibilities now include responsive layout review. Tasks and counts are unchanged."
          buttonLabel="View team"
          onButtonClick={() => navigate(location.pathname)}
        />
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Team</h2>
      <p className={styles.subtitle}>3 joined members · Saved acceptance: 19 Oct 2026</p>

      {members.map((member) => {
        const isEditing = editingMember === member.name;

        if (isEditing) {
          return (
            <div key={member.name} className={styles.memberCard}>
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
                Unsaved role changes for {member.name}. Commitment unchanged: {member.hoursPerWeek} h/week, 19 Oct–30 Nov.
              </p>
              <Button type="button" fullWidth onClick={confirmRoleSave}>Confirm role changes</Button>
              <Button type="button" variant="secondary" fullWidth onClick={resetEdit}>Cancel</Button>
            </div>
          );
        }

        return (
          <div key={member.name} className={styles.memberCard}>
            <div className={styles.memberHeader}>
              <div className={styles.avatar}>{member.name.charAt(0)}</div>
              <p className={styles.memberName}>{member.name} · {member.role}</p>
            </div>

            <p className={styles.memberRole}>{member.role}</p>
            <p className={styles.memberResponsibilities}>Responsibilities: {memberResponsibilities[member.name] || "Project work"}</p>
            <p className={styles.metaLine} id={`commitment-${member.name}`}>
              Commitment summary · {member.hoursPerWeek} h / week · 6 weeks
              <br />
              19 Oct–30 Nov 2026 · {member.commitmentType}
            </p>
            <a className={styles.linkButton} href={`#commitment-${member.name}`}>
              View commitment summary
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
                {member.name === "David" && (
                  <Link className={styles.releaseLink} to="./release-role">
                    Review release of David&apos;s role
                  </Link>
                )}
              </>
            )}

            {currentUser.name === "David" && member.name === "David" && !isOwner && (
              <StateNotice
                variant="info"
                title="Role details are read only"
                text="Only Ada, the Owner, manages team roles. You can view saved commitments."
              />
            )}
          </div>
        );
      })}
    </section>
  );
}

export default Team;
