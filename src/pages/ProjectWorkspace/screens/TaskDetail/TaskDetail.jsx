import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import Skeleton from "../../../../components/Skeleton";
import {
  createProjectTaskComment,
  deleteProjectTask,
  deleteProjectTaskComment,
  getProjectTask,
  getProjectTaskComments,
  getTaskApiStatus,
  mapComment,
  updateProjectTask,
  updateProjectTaskComment,
} from "../../../../services/tasksService";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import TaskSummaryCard from "../../shared/TaskSummaryCard";
import styles from "./TaskDetail.module.css";

const taskStatusOptions = [
  { value: "To do", label: "To do" },
  { value: "In progress", label: "In progress" },
  { value: "In review", label: "In review" },
  { value: "Done", label: "Done" },
  { value: "Blocked", label: "Blocked" },
];

function formatErrorMessage(error, fallback = "Something went wrong. Try again.") {
  if (!error) return fallback;
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const messages = error.errors
      .map((entry) =>
        typeof entry === "string" ? entry : entry?.message || JSON.stringify(entry),
      )
      .filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }
  if (error.errors && typeof error.errors === "object") {
    const messages = Object.values(error.errors)
      .flat()
      .map((entry) =>
        typeof entry === "string" ? entry : entry?.message || JSON.stringify(entry),
      )
      .filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }
  return error.message || fallback;
}

function TaskDetail() {
  const { projectId, taskId } = useParams();
  const {
    currentUser,
    isOwner,
    canManageMembers,
    project,
    milestones,
    workspaceLoading,
    workspaceError,
    retryWorkspace,
    refreshTasks,
  } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const asParam = new URLSearchParams(location.search).get("as");
  const [detailRetryCount, setDetailRetryCount] = useState(0);
  const [taskState, setTaskState] = useState({
    projectId: null,
    taskId: null,
    retryCount: -1,
    loading: true,
    error: "",
    task: null,
  });
  const [commentsState, setCommentsState] = useState({
    projectId: null,
    taskId: null,
    retryCount: -1,
    loading: true,
    error: "",
    comments: [],
  });
  const [status, setStatus] = useState("To do");
  const [blockerNote, setBlockerNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [statusError, setStatusError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [noChangesNotice, setNoChangesNotice] = useState(false);
  const [draftComment, setDraftComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [isConfirmingDeleteTask, setIsConfirmingDeleteTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [deleteTaskError, setDeleteTaskError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentActionLoadingId, setCommentActionLoadingId] = useState(null);
  const [commentActionError, setCommentActionError] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const isTaskCurrent =
    taskState.projectId === projectId &&
    taskState.taskId === taskId &&
    taskState.retryCount === detailRetryCount;
  const task = isTaskCurrent ? taskState.task : null;
  const isTaskLoading =
    workspaceLoading || !isTaskCurrent || taskState.loading;
  const taskError = workspaceError
    ? workspaceError
    : isTaskCurrent
      ? taskState.error
      : "";
  const isCommentsCurrent =
    commentsState.projectId === projectId &&
    commentsState.taskId === taskId &&
    commentsState.retryCount === detailRetryCount;
  const comments = isCommentsCurrent ? commentsState.comments : [];
  const commentsLoading =
    workspaceLoading || !isCommentsCurrent || commentsState.loading;
  const commentsError = isCommentsCurrent ? commentsState.error : "";

  useEffect(() => {
    if (workspaceLoading || workspaceError || !project) return undefined;
    let isCurrent = true;

    getProjectTask(projectId, taskId, {
      memberships: project.memberships,
      milestones,
    })
      .then((loadedTask) => {
        if (!isCurrent) return;
        setStatus(loadedTask.status);
        setBlockerNote(loadedTask.blockerNote);
        setCompletionNote("");
        setArtifactUrl("");
        setStatusError("");
        setSuccessMessage("");
        setNoChangesNotice(false);
        setTaskState({
          projectId,
          taskId,
          retryCount: detailRetryCount,
          loading: false,
          error: "",
          task: loadedTask,
        });
      })
      .catch((error) => {
        console.error("Failed to load task details:", error);
        if (!isCurrent) return;
        setTaskState({
          projectId,
          taskId,
          retryCount: detailRetryCount,
          loading: false,
          error: formatErrorMessage(error, "Something went wrong. Try again."),
          task: null,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [
    projectId,
    taskId,
    project,
    milestones,
    workspaceLoading,
    workspaceError,
    detailRetryCount,
  ]);

  useEffect(() => {
    if (workspaceLoading || workspaceError || !project) return undefined;
    let isCurrent = true;

    getProjectTaskComments(projectId, taskId)
      .then((loadedComments) => {
        if (!isCurrent) return;
        setCommentsState({
          projectId,
          taskId,
          retryCount: detailRetryCount,
          loading: false,
          error: "",
          comments: loadedComments,
        });
      })
      .catch((error) => {
        console.error("Failed to load task comments:", error);
        if (!isCurrent) return;
        setCommentsState({
          projectId,
          taskId,
          retryCount: detailRetryCount,
          loading: false,
          error: formatErrorMessage(error, "Something went wrong. Try again."),
          comments: [],
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [
    projectId,
    taskId,
    project,
    workspaceLoading,
    workspaceError,
    detailRetryCount,
  ]);

  const taskRoute =
    `/projects/${projectId}/workspace/tasks` +
    (asParam ? `?as=${encodeURIComponent(asParam)}` : "");
  const reassignRoute =
    `/projects/${projectId}/workspace/tasks/${taskId}/reassign` +
    (asParam ? `?as=${encodeURIComponent(asParam)}` : "");
  const isAssignee = Boolean(
    task &&
      ((currentUser.projectMemberId &&
        task.assigneeMemberId &&
        String(currentUser.projectMemberId) === String(task.assigneeMemberId)) ||
        (currentUser.id &&
          task.assigneeUserId &&
          String(currentUser.id) === String(task.assigneeUserId)) ||
        (currentUser.name &&
          task.assignee &&
          task.assignee !== "Unassigned" &&
          currentUser.name === task.assignee)),
  );
  const canChangeStatus = canManageMembers || isAssignee;
  const canComment =
    isOwner ||
    canManageMembers ||
    Boolean(
      currentUser.projectMemberId &&
        (!currentUser.status || currentUser.status === "ACTIVE"),
    );

  const isCommentAuthor = (entry) => {
    if (!currentUser || !entry) return false;
    // author.id from the API is a user id — compare against currentUser.id only
    if (
      currentUser.id &&
      entry.authorId &&
      String(currentUser.id) === String(entry.authorId)
    ) {
      return true;
    }
    return false;
  };
  const milestone = task
    ? milestones.find((item) => String(item.id) === String(task.milestoneId))
    : null;

  const resetStatusForm = () => {
    setStatus(task.status);
    setBlockerNote(task.blockerNote);
    setCompletionNote("");
    setArtifactUrl("");
    setStatusError("");
    setSuccessMessage("");
    setNoChangesNotice(false);
  };

  const saveStatus = async () => {
    if (!canChangeStatus || statusSaving) return;
    if (status === "Blocked") {
      if (!blockerNote.trim()) {
        setStatusError("Add a short blocker note before saving.");
        return;
      }
      if (blockerNote.trim().length > 1000) {
        setStatusError("Blocker note must be 1000 characters or fewer.");
        return;
      }
    }
    if (status === "Done") {
      if (completionNote.trim().length > 2000) {
        setStatusError("Completion note must be 2000 characters or fewer.");
        return;
      }
    }

    const changes = {};
    if (status !== task.status) {
      changes.status = getTaskApiStatus(status);
    }
    if (status === "Blocked") {
      if (changes.status === "BLOCKED" || blockerNote.trim() !== task.blockerNote) {
        changes.blockerNote = blockerNote.trim();
      }
    }
    if (status === "Done") {
      const contribution = {};
      if (completionNote.trim()) {
        contribution.completionNote = completionNote.trim();
      }
      if (artifactUrl.trim()) {
        contribution.artifactUrl = artifactUrl.trim();
      }
      if (Object.keys(contribution).length > 0) {
        contribution.title = (task.title || "").slice(0, 200);
        changes.contribution = contribution;
      }
    }

    if (Object.keys(changes).length === 0) {
      setSuccessMessage("");
      setNoChangesNotice(true);
      setStatusError("");
      return;
    }

    setStatusSaving(true);
    setStatusError("");
    setSuccessMessage("");
    setNoChangesNotice(false);
    try {
      await updateProjectTask(projectId, taskId, changes);
      const updatedTask = await getProjectTask(projectId, taskId, {
        memberships: project.memberships,
        milestones,
      });
      setStatus(updatedTask.status);
      setBlockerNote(updatedTask.blockerNote);
      setCompletionNote("");
      setArtifactUrl("");
      setTaskState({
        projectId,
        taskId,
        retryCount: detailRetryCount,
        loading: false,
        error: "",
        task: updatedTask,
      });
      setSuccessMessage(`${updatedTask.title} saved.`);
      setNoChangesNotice(false);
      try {
        await refreshTasks();
      } catch (refreshErr) {
        setStatusError(
          `Task saved, but the task list could not be refreshed: ${formatErrorMessage(refreshErr)}`,
        );
      }
    } catch (error) {
      setStatusError(formatErrorMessage(error, "Task status did not save."));
    } finally {
      setStatusSaving(false);
    }
  };

  const postComment = async () => {
    if (!canComment || commentSaving) return;
    const content = draftComment.trim();
    if (!content) {
      setCommentError("Enter a comment before posting.");
      return;
    }
    if (content.length > 3000) {
      setCommentError("Comments must be 3000 characters or fewer.");
      return;
    }

    setCommentSaving(true);
    setCommentError("");
    try {
      await createProjectTaskComment(projectId, taskId, content);
      setDraftComment("");
    } catch (error) {
      setCommentError(formatErrorMessage(error, "Comment could not be posted."));
      setCommentSaving(false);
      return;
    }

    try {
      const loadedComments = await getProjectTaskComments(projectId, taskId);
      setCommentsState({
        projectId,
        taskId,
        retryCount: detailRetryCount,
        loading: false,
        error: "",
        comments: loadedComments,
      });
    } catch (error) {
      setCommentsState((current) => ({
        ...current,
        loading: false,
        error: formatErrorMessage(error, "Comments could not be refreshed."),
      }));
      setCommentError(
        `Comment posted, but comments could not be refreshed: ${formatErrorMessage(error)}`,
      );
    } finally {
      setCommentSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!canManageMembers || isDeletingTask) return;
    setIsDeletingTask(true);
    setDeleteTaskError("");
    try {
      await deleteProjectTask(projectId, taskId);
      try {
        await refreshTasks();
      } catch (refreshErr) {
        console.warn("Could not refresh tasks list after deletion:", refreshErr);
      }
      navigate(taskRoute);
    } catch (error) {
      setDeleteTaskError(
        formatErrorMessage(error, "Task could not be deleted."),
      );
      setIsDeletingTask(false);
    }
  };

  const startEditComment = (entry) => {
    setEditingCommentId(entry.id);
    setEditingCommentText(entry.message || "");
    setCommentActionError("");
    setDeletingCommentId(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
    setCommentActionError("");
  };

  const handleUpdateComment = async (commentId) => {
    const content = editingCommentText.trim();
    if (!content) {
      setCommentActionError("Comment cannot be empty.");
      return;
    }
    if (content.length > 3000) {
      setCommentActionError("Comments must be 3000 characters or fewer.");
      return;
    }

    setCommentActionLoadingId(commentId);
    setCommentActionError("");
    try {
      const response = await updateProjectTaskComment(
        projectId,
        taskId,
        commentId,
        content,
      );
      if (Array.isArray(response?.comments)) {
        setCommentsState((prev) => ({
          ...prev,
          comments: response.comments.map(mapComment),
        }));
      } else if (Array.isArray(response)) {
        setCommentsState((prev) => ({
          ...prev,
          comments: response.map(mapComment),
        }));
      } else {
        const updatedComment =
          response?.comment ??
          (response && typeof response === "object" && response.id
            ? response
            : null);
        setCommentsState((prev) => ({
          ...prev,
          comments: prev.comments.map((item) =>
            String(item.id) === String(commentId)
              ? {
                  ...item,
                  message:
                    typeof updatedComment?.content === "string"
                      ? updatedComment.content
                      : content,
                }
              : item,
          ),
        }));
      }
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      setCommentActionError(
        formatErrorMessage(error, "Comment could not be updated."),
      );
    } finally {
      setCommentActionLoadingId(null);
    }
  };

  const startDeleteComment = (commentId) => {
    setDeletingCommentId(commentId);
    setCommentActionError("");
    setEditingCommentId(null);
  };

  const cancelDeleteComment = () => {
    setDeletingCommentId(null);
    setCommentActionError("");
  };

  const handleDeleteComment = async (commentId) => {
    setCommentActionLoadingId(commentId);
    setCommentActionError("");
    try {
      const response = await deleteProjectTaskComment(
        projectId,
        taskId,
        commentId,
      );
      if (Array.isArray(response?.comments)) {
        setCommentsState((prev) => ({
          ...prev,
          comments: response.comments.map(mapComment),
        }));
      } else if (Array.isArray(response)) {
        setCommentsState((prev) => ({
          ...prev,
          comments: response.map(mapComment),
        }));
      } else {
        setCommentsState((prev) => ({
          ...prev,
          comments: prev.comments.filter(
            (item) => String(item.id) !== String(commentId),
          ),
        }));
      }
      setDeletingCommentId(null);
    } catch (error) {
      setCommentActionError(
        formatErrorMessage(error, "Comment could not be deleted."),
      );
    } finally {
      setCommentActionLoadingId(null);
    }
  };

  if (workspaceError) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Task detail</h2>
        <Alert variant="error" title="Couldn't load project details">
          {workspaceError}
        </Alert>
        <Button onClick={retryWorkspace}>Retry</Button>
      </section>
    );
  }

  if (isTaskLoading) {
    return (
      <section className={styles.page} aria-live="polite">
        <h2 className={styles.pageTitle}>Task detail</h2>
        <p role="status">Loading task details…</p>
        <Skeleton />
        <Skeleton />
      </section>
    );
  }

  if (taskError) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Task detail</h2>
        <Alert variant="error" title="Couldn't load task">
          {taskError}
        </Alert>
        <Button onClick={() => setDetailRetryCount((count) => count + 1)}>
          Retry
        </Button>
        <Link to={taskRoute}>Back to tasks</Link>
      </section>
    );
  }

  if (!task) {
    return (
      <section className={styles.page}>
        <EmptyState title="Task not found" text="This task is no longer available.">
          <Link to={taskRoute}>Back to tasks</Link>
        </EmptyState>
      </section>
    );
  }

  const renderStatusPanel = () => {
    if (!canChangeStatus) {
      return (
        <div className={styles.panel}>
          <StateNotice
            variant="info"
            title="Task status is read only"
            text={`${task.assignee} is the assignee. ${currentUser.name} can view and comment, but cannot change ${task.assignee}'s status.`}
          />
          <p className={styles.summaryText}>
            Owner: {task.assignee} · Due {task.dueDate} · {milestone?.name || task.milestoneTitle || task.milestoneName || ""} · {task.status}
          </p>
        </div>
      );
    }

    return (
      <div className={styles.panel}>
        {isAssignee && (
          <p className={styles.roleLine}>
            You&apos;re the assignee. You can update this task&apos;s status.
          </p>
        )}
        {statusError && (
          <Alert variant="error" title="Task status did not save">
            {statusError}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" title="Task status saved">
            {successMessage}
          </Alert>
        )}
        {noChangesNotice && (
          <Alert variant="info">
            No task changes to save.
          </Alert>
        )}
        <div className={styles.statusCard}>
          <Select
            label="Task status"
            required
            value={status}
            options={taskStatusOptions}
            onChange={(event) => {
              setStatus(event.target.value);
              setStatusError("");
              setSuccessMessage("");
              setNoChangesNotice(false);
            }}
          />
          {status === "Blocked" && (
            <Input
              label="Blocker note"
              required
              maxLength={1000}
              value={blockerNote}
              onChange={(event) => {
                setBlockerNote(event.target.value);
                setSuccessMessage("");
                setNoChangesNotice(false);
              }}
              error={statusError && !blockerNote.trim() ? statusError : ""}
              placeholder="Describe what is blocking this task."
            />
          )}
          {status === "Done" && (
            <>
              <Input
                label="Artifact link"
                type="url"
                value={artifactUrl}
                onChange={(event) => {
                  setArtifactUrl(event.target.value);
                  setSuccessMessage("");
                  setNoChangesNotice(false);
                }}
                placeholder="https://example.org"
              />
              <Button type="button" variant="secondary" fullWidth disabled>
                File attachments not available yet
              </Button>
              <Input
                label="Completion note"
                multiline
                maxLength={2000}
                value={completionNote}
                onChange={(event) => {
                  setCompletionNote(event.target.value);
                  setSuccessMessage("");
                  setNoChangesNotice(false);
                }}
              />
              <p className={styles.metaLine}>
                Completion notes and links are optional. Attachments are not
                wired yet.
              </p>
            </>
          )}
          <div className={styles.inlineButtons}>
            <Button
              type="button"
              loading={statusSaving}
              loadingText="Saving task status…"
              onClick={saveStatus}
            >
              Save task status
            </Button>
          </div>
          <p className={styles.metaLine}>
            Status required. Blocked requires a note. Moving away from Blocked
            clears the saved note.
          </p>
          <button
            type="button"
            className={styles.cancelLink}
            onClick={resetStatusForm}
          >
            Cancel local changes
          </button>
        </div>
        {canManageMembers && (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate(reassignRoute)}
          >
            Reassign task
          </Button>
        )}
        {canManageMembers && (
          <div className={styles.deleteTaskSection}>
            {deleteTaskError && (
              <Alert variant="error" title="Could not delete task">
                {deleteTaskError}
              </Alert>
            )}
            {isConfirmingDeleteTask ? (
              <div className={styles.deleteConfirmCard}>
                <p className={styles.metaLine}>
                  Are you sure you want to delete <strong>{task.title}</strong>? This action cannot be undone.
                </p>
                <div className={styles.deleteButtonRow}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isDeletingTask}
                    onClick={() => {
                      setIsConfirmingDeleteTask(false);
                      setDeleteTaskError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    loading={isDeletingTask}
                    loadingText="Deleting task…"
                    onClick={handleDeleteTask}
                  >
                    Confirm delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsConfirmingDeleteTask(true);
                  setDeleteTaskError("");
                }}
              >
                Delete task
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Task detail</h2>
      <TaskSummaryCard task={task} milestone={milestone} />
      {task.createdBy && (
        <p className={styles.metaLine}>Created by {task.createdBy}</p>
      )}
      {task.contributions.length > 0 && (
        <div className={styles.panel}>
          <h3 className={styles.sectionTitle}>Contributions</h3>
          {task.contributions.map((contribution, index) => (
            <div className={styles.comment} key={contribution.id || index}>
              <strong>{contribution.title || "Completed work"}</strong>
              {contribution.completionNote && <p>{contribution.completionNote}</p>}
              {contribution.artifactUrl && (
                <p>
                  <a href={contribution.artifactUrl} target="_blank" rel="noreferrer">
                    View contribution
                  </a>
                </p>
              )}
              {contribution.fileUrl && (
                <p>
                  <a href={contribution.fileUrl} target="_blank" rel="noreferrer">
                    View attached file
                  </a>
                </p>
              )}
              {contribution.evidence.length > 0 && (
                <p className={styles.metaLine}>
                  {contribution.evidence.length} evidence item
                  {contribution.evidence.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {renderStatusPanel()}

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>Task comments</h3>
        {commentsLoading ? (
          <p role="status">Loading comments…</p>
        ) : commentsError ? (
          <>
            <Alert variant="error" title="Couldn't load comments">
              {commentsError}
            </Alert>
            <Button
              variant="secondary"
              onClick={() => setDetailRetryCount((count) => count + 1)}
            >
              Retry comments
            </Button>
          </>
        ) : comments.length === 0 ? (
          <p className={styles.metaLine}>No comments yet.</p>
        ) : (
          <div className={styles.commentList}>
            {commentActionError && (
              <Alert variant="error" title="Comment action failed">
                {commentActionError}
              </Alert>
            )}
            {comments.map((entry) => {
              const isAuthor = isCommentAuthor(entry);
              const canEdit = isAuthor;
              const canDelete = isAuthor || canManageMembers;
              const isEditing = editingCommentId === entry.id;
              const isDeleting = deletingCommentId === entry.id;
              const isActionLoading = commentActionLoadingId === entry.id;

              return (
                <div key={entry.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentMeta}>
                      <strong>{entry.author || "Project member"}</strong>
                      {entry.date && <span> · {entry.date}</span>}
                    </div>
                    {!isEditing && !isDeleting && (canEdit || canDelete) && (
                      <div className={styles.commentActions}>
                        {canEdit && (
                          <button
                            type="button"
                            className={styles.commentActionBtn}
                            onClick={() => startEditComment(entry)}
                            disabled={Boolean(commentActionLoadingId)}
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className={`${styles.commentActionBtn} ${styles.commentActionBtnDanger}`}
                            onClick={() => startDeleteComment(entry.id)}
                            disabled={Boolean(commentActionLoadingId)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className={styles.commentEditForm}>
                      <Input
                        label="Edit comment"
                        maxLength={3000}
                        value={editingCommentText}
                        onChange={(event) =>
                          setEditingCommentText(event.target.value)
                        }
                        placeholder="Edit your comment."
                      />
                      <div className={styles.commentConfirmRow}>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isActionLoading}
                          onClick={cancelEditComment}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          loading={isActionLoading}
                          loadingText="Saving…"
                          onClick={() => handleUpdateComment(entry.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    <div className={styles.commentConfirmRow}>
                      <p className={styles.metaLine}>
                        Delete this comment?
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isActionLoading}
                        onClick={cancelDeleteComment}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        loading={isActionLoading}
                        loadingText="Deleting…"
                        onClick={() => handleDeleteComment(entry.id)}
                      >
                        Confirm delete
                      </Button>
                    </div>
                  ) : (
                    <p>{entry.message}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {commentError && (
          <Alert variant="error" title="Comment could not be posted">
            {commentError}
          </Alert>
        )}
        {canComment ? (
          <>
            <Input
              id="commentInput"
              label="Comment"
              maxLength={3000}
              value={draftComment}
              onChange={(event) => {
                setDraftComment(event.target.value);
                setCommentError("");
              }}
              placeholder="Add a comment to this task."
            />
            <Button
              type="button"
              fullWidth
              loading={commentSaving}
              loadingText="Posting comment…"
              onClick={postComment}
            >
              Post comment
            </Button>
          </>
        ) : (
          <p className={styles.metaLine}>
            Only active project members can post comments.
          </p>
        )}
        <p className={styles.metaLine}>Task comments stay with this task.</p>
      </div>

      <p className={styles.footerNote}>
        Saved: {task.status} · Due {task.dueDate} · {task.assignee} ·{" "}
        {milestone?.name || task.milestoneTitle || task.milestoneName || ""}
      </p>
    </section>
  );
}

export default TaskDetail;
