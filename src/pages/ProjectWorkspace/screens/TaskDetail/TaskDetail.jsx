import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import Skeleton from "../../../../components/Skeleton";
import { getTaskById, taskComments } from "../../../../data/workspaceData";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import TaskSummaryCard from "../../shared/TaskSummaryCard";
import styles from "./TaskDetail.module.css";

const commentPlaceholders = {
  assignee: "I'll update the flow once the fields are agreed.",
  owner: "Let's review who can take this work.",
  other: "I can share the agreed sign-up fields.",
};

function TaskDetail() {
  const { taskId } = useParams();
  const { currentUser, isOwner, milestones, tasks } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const previewState = searchParams.get("state");
  const asParam = searchParams.get("as");

  const task = getTaskById(taskId) ?? tasks.find((item) => item.id === taskId);
  const [status, setStatus] = useState(task?.status || "To do");
  const [blockerNote, setBlockerNote] = useState(task?.blockerNote || "");
  const [statusError, setStatusError] = useState("");
  const [draftComment, setDraftComment] = useState("");
  const [comments, setComments] = useState(
    task ? taskComments.filter((entry) => entry.taskId === task.id) : [],
  );

  if (!task) {
    return (
      <section className={styles.page}>
        <EmptyState title="Task not found" text="This task is no longer available.">
          <Link to={`/projects/${location.pathname.split("/")[2]}/workspace/tasks${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`}>
            Back to tasks
          </Link>
        </EmptyState>
      </section>
    );
  }

  const milestone = milestones.find((item) => item.id === task.milestoneId);
  const isAssignee = currentUser.name === task.assignee;

  const taskRoute = `/projects/${location.pathname.split("/")[2]}/workspace/tasks${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;
  const reassignRoute = `/projects/${location.pathname.split("/")[2]}/workspace/tasks/${task.id}/reassign${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;

  const resetStatusForm = () => {
    setStatus(task.status);
    setBlockerNote(task.blockerNote || "");
    setStatusError("");
  };

  const saveStatus = () => {
    if (status === "Blocked" && !blockerNote.trim()) {
      setStatusError("Add a short blocker note before saving.");
      return;
    }

    setStatusError("");
    navigate(`${location.pathname}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`);
  };

  const postComment = () => {
    if (!draftComment.trim()) {
      return;
    }

    const entry = {
      taskId: task.id,
      author: currentUser.name,
      date: "2026-11-12",
      message: draftComment,
    };

    setComments((previous) => [...previous, entry]);
    setDraftComment("");
  };

  const renderStatusPanel = () => {
    if (isAssignee) {
      return (
        <div className={styles.panel}>
          <p className={styles.roleLine}>You&apos;re the assignee. Only you can change this task&apos;s status.</p>
          <div className={styles.statusCard}>
            <Select
              label="Task status"
              required
              value={status}
              options={[
                { value: "To do", label: "To do" },
                { value: "In progress", label: "In progress" },
                { value: "In review", label: "In review" },
                { value: "Done", label: "Done" },
                { value: "Blocked", label: "Blocked" },
              ]}
              onChange={(event) => setStatus(event.target.value)}
            />
            {status === "Blocked" && (
              <Input
                label="Blocker note"
                required
                value={blockerNote}
                onChange={(event) => setBlockerNote(event.target.value)}
                error={statusError}
                placeholder={statusError ? "Not entered" : "Waiting for agreed sign-up fields."}
              />
            )}
            {status === "Done" && (
              <>
                <Input
                  label="Artifact link"
                  value="https://example.org/onboarding"
                  placeholder="https://example.org/onboarding"
                />
                <Button type="button" variant="secondary" fullWidth>
                  Attach a file (optional)
                </Button>
                <Input
                  label="Completion note"
                  value="Updated the flow after agreeing sign-up fields."
                />
                <p className={styles.metaLine}>
                  Link, file and note optional. Done not saved; no contribution added yet.
                </p>
              </>
            )}
            <div className={styles.inlineButtons}>
              <Button type="button" onClick={saveStatus}>Save task status</Button>
            </div>
            <p className={styles.metaLine}>Status required. Blocked requires a note. Failed saves keep the saved status.</p>
            <button type="button" className={styles.cancelLink} onClick={resetStatusForm}>
              Cancel local changes
            </button>
          </div>
        </div>
      );
    }

    if (isOwner && !isAssignee) {
      return (
        <div className={styles.panel}>
          <div className={styles.statusCard}>
            <Select
              label="Task status"
              value={status}
              options={[
                { value: "To do", label: "To do" },
                { value: "In progress", label: "In progress" },
                { value: "In review", label: "In review" },
                { value: "Done", label: "Done" },
                { value: "Blocked", label: "Blocked" },
              ]}
              disabled
            />
            <Input label="Saved blocker note" value={task.blockerNote || ""} disabled />
            <p className={styles.metaLine}>
              Only {task.assignee}, the assignee, can save this status. You can comment.
            </p>
            <Button type="button" variant="secondary" fullWidth onClick={() => navigate(reassignRoute)}>
              Reassign task
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.panel}>
        <StateNotice
          variant="info"
          title="Task status is read only"
          text={`${task.assignee} is the assignee. ${currentUser.name} can view and comment, but cannot change ${task.assignee}'s status.`}
        />
        <p className={styles.summaryText}>
          Owner: {task.assignee} · Due {task.dueDate} / {milestone ? `${milestone.id} ${milestone.name}` : ""} · {task.status}
        </p>
      </div>
    );
  };

  const commentPlaceholder = isAssignee
    ? commentPlaceholders.assignee
    : isOwner
      ? commentPlaceholders.owner
      : commentPlaceholders.other;

  const commentsSection = previewState === "nocomments" ? (
    <div className={styles.panel}>
      <Alert variant="info" title="No comments yet">
        David&apos;s task remains Blocked. Comments do not change status.
      </Alert>
      <Button
        type="button"
        fullWidth
        onClick={() => document.getElementById("commentInput")?.focus()}
      >
        Add comment
      </Button>
    </div>
  ) : (
    <div className={styles.panel}>
      <h3 className={styles.sectionTitle}>Task comments</h3>
      <div className={styles.commentList}>
        {comments.map((entry) => (
          <div key={`${entry.author}-${entry.date}-${entry.message}`} className={styles.comment}>
            <div className={styles.commentHeader}>
              <strong>{entry.author}</strong>
              <span> · {entry.date}</span>
            </div>
            <p>{entry.message}</p>
          </div>
        ))}
      </div>
      <Input
        id="commentInput"
        label="Comment"
        value={draftComment}
        onChange={(event) => setDraftComment(event.target.value)}
        placeholder={commentPlaceholder}
      />
      <Button type="button" fullWidth onClick={postComment}>
        Post comment
      </Button>
      <p className={styles.metaLine}>Task comments stay with this task.</p>
    </div>
  );

  if (previewState === "saving") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Task detail</h2>
        <StateNotice
          variant="info"
          title="Saving task status…"
          text="Saving. Status stays Blocked and 2/6 Done until confirmed; save locked."
        />
        <Skeleton />
      </section>
    );
  }

  if (previewState === "error") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Task detail</h2>
        <StateNotice
          variant="error"
          title="Task status did not save"
          text="Save failed. Blocked, blocker note and 2/6 Done unchanged. Local edits retained."
          buttonLabel="Retry status save"
          onButtonClick={() => navigate(location.pathname + (asParam ? `?as=${encodeURIComponent(asParam)}` : ""))}
        />
      </section>
    );
  }

  if (previewState === "saved") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Task detail</h2>
        <StateNotice
          variant="success"
          title="Done status saved"
          text="Design onboarding saved as Done. Blocker resolved. 3/6 Done; M2 1/3. Contribution recorded, not peer-confirmed."
          buttonLabel="View task"
          onButtonClick={() => navigate(taskRoute)}
        />
      </section>
    );
  }

  if (previewState === "uploadfailed") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Task detail</h2>
        <div className={styles.uploadState}>
          <Alert variant="error" title="File did not upload">
            onboarding-draft.fig was not attached. Your link, note and local Done
            selection are retained. Stored task is still Blocked.
          </Alert>
          <div className={styles.uploadActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                navigate(
                  location.pathname +
                    (asParam ? `?as=${encodeURIComponent(asParam)}` : ""),
                )
              }
            >
              Retry file upload
            </Button>
            <Button type="button" variant="primary">
              Save Done without the file
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Task detail</h2>

      <TaskSummaryCard task={task} milestone={milestone} />

      {renderStatusPanel()}

      {commentsSection}

      <p className={styles.footerNote}>
        Saved: {task.status} · Due {task.dueDate} · {task.assignee} · {milestone ? `${milestone.id} ${milestone.name}` : ""}
      </p>
    </section>
  );
}

export default TaskDetail;
