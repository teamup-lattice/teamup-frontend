import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import { getTaskById, members, workspaceProject } from "../../../../data/workspaceData";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import TaskSummaryCard from "../../shared/TaskSummaryCard";
import styles from "./ReassignTask.module.css";

function ReassignTask() {
  const { taskId } = useParams();
  const { currentUser, milestones } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const previewState = searchParams.get("state");
  const asParam = searchParams.get("as");

  const task = getTaskById(taskId);
  const [newOwner, setNewOwner] = useState("");
  const [handoverNote, setHandoverNote] = useState("Share the agreed sign-up fields first.");
  const [reviewMode, setReviewMode] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  if (!task) {
    return (
      <section className={styles.page}>
        <EmptyState title="Task not found" text="This task is no longer available.">
          <Button onClick={() => navigate(`/projects/${location.pathname.split("/")[2]}/workspace/tasks${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`)}>
            Back to tasks
          </Button>
        </EmptyState>
      </section>
    );
  }

  const isCurrentOwner = currentUser.name === workspaceProject.ownerName;
  const milestone = milestones.find((item) => item.id === task.milestoneId);
  const availableMembers = members.filter(
    (member) => member.status === "Accepted" && member.name !== task.assignee,
  );

  const goBack = () => navigate(`/projects/${location.pathname.split("/")[2]}/workspace/tasks/${task.id}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`);

  if (!isCurrentOwner) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="info"
          title="Only Ada, the Owner, can reassign tasks."
          buttonLabel="View task"
          onButtonClick={goBack}
        />
      </section>
    );
  }

  if (previewState === "noselection") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="info"
          title="Choose a new task owner"
          text="Select one other accepted member. David remains owner until reassignment is confirmed."
          buttonLabel="Choose owner"
          onButtonClick={() => navigate(location.pathname + (asParam ? `?as=${encodeURIComponent(asParam)}` : ""))}
        />
      </section>
    );
  }

  if (previewState === "saving") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="info"
          title="Saving new owner…"
          text="Saving reassignment. David remains owner; John and note retained. Save locked."
        />
      </section>
    );
  }

  if (previewState === "error") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="error"
          title="Task owner did not change"
          text="David remains the owner. Status Blocked, due 10 Nov and M2 are unchanged. John and your note are retained."
          buttonLabel="Retry reassignment"
          onButtonClick={() => navigate(location.pathname + (asParam ? `?as=${encodeURIComponent(asParam)}` : ""))}
        />
      </section>
    );
  }

  if (previewState === "saved") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="success"
          title="Task reassigned to John"
          text="2/6 Done stays unchanged. Blocked, due 10 Nov and M2 remain. Comments, history, files and completed records are preserved."
          buttonLabel="View task"
          onButtonClick={goBack}
        />
      </section>
    );
  }

  if (confirmed) {
    const reassignedTask = { ...task, assignee: newOwner };
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <TaskSummaryCard task={reassignedTask} milestone={milestone} />
        <div className={styles.confirmationRow}>
          <p className={styles.savedNotice}>Team notice: Ada reassigned Design onboarding from David to John.</p>
          <p className={styles.savedNotice}>No automatic contribution credit is added by reassignment or release.</p>
        </div>
      </section>
    );
  }

  if (reviewMode) {
    const selectedMember = availableMembers.find((member) => member.name === newOwner);
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <TaskSummaryCard task={task} milestone={milestone} />

        <div className={styles.reviewCard}>
          <h3 className={styles.reviewTitle}>Reassign {task.title} to {selectedMember?.name}?</h3>
          <p className={styles.reviewBody}>{task.assignee} → {selectedMember?.name} · Accepted {selectedMember ? "19 Oct" : ""}</p>
          <p className={styles.reviewBody}>Unchanged: Blocked · Due 10 Nov · M2 Working prototype</p>
          <p className={styles.reviewBody}>Blocker: Waiting for agreed sign-up fields.</p>
          <p className={styles.reviewBody}>Handover note: {handoverNote} Comments, history, files and completed work are preserved.</p>
          <div className={styles.buttonRow}>
            <Button type="button" variant="secondary" onClick={() => setReviewMode(false)}>Cancel</Button>
            <Button type="button" onClick={() => setConfirmed(true)}>Confirm reassignment</Button>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!newOwner) {
      setError("Choose one other accepted member.");
      return;
    }
    setError("");
    setReviewMode(true);
  };

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Reassign task</h2>
      <TaskSummaryCard task={task} milestone={milestone} />

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <h3 className={styles.sectionTitle}>Reassign task</h3>
        <p className={styles.helper}>Current owner: {task.assignee}. Choose one new owner and review the handover.</p>
        <Select
          label="New owner"
          required
          value={newOwner}
          options={availableMembers.map((member) => ({
            value: member.name,
            label: `${member.name} · ${member.role} · Accepted ${member.acceptedDate ? new Date(`${member.acceptedDate}T00:00:00Z`).getDate() : ""} ${member.acceptedDate ? new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(`${member.acceptedDate}T00:00:00Z`)) : ""}`,
          }))}
          placeholder={error ? "Not selected" : "Select a new owner"}
          onChange={(event) => setNewOwner(event.target.value)}
          error={error}
        />
        <Input
          label="Handover note"
          value={handoverNote}
          onChange={(event) => setHandoverNote(event.target.value)}
        />
        <p className={styles.helper}>Owner: Ada. John is an accepted member. Selection unsaved; David still owns the task.</p>
        <div className={styles.buttonRow}>
          <Button type="button" variant="secondary" onClick={goBack}>Cancel</Button>
          <Button type="submit">Review reassignment</Button>
        </div>
        <p className={styles.footerNote}>One new owner only. Cancel has no effect on the stored task.</p>
      </form>
    </section>
  );
}

export default ReassignTask;
