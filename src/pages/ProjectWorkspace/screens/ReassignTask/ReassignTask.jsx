import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import { getProjectTask, updateProjectTask } from "../../../../services/tasksService";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import TaskSummaryCard from "../../shared/TaskSummaryCard";
import styles from "./ReassignTask.module.css";

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

function ReassignTask() {
  const { projectId, taskId } = useParams();
  const {
    canManageMembers,
    project,
    tasks,
    tasksLoading,
    tasksError,
    retryTasks,
    milestones,
    workspaceLoading,
    workspaceError,
    retryWorkspace,
    refreshTasks,
  } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const asParam = new URLSearchParams(location.search).get("as");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [retryFetchCount, setRetryFetchCount] = useState(0);
  const [fetchedTaskState, setFetchedTaskState] = useState({
    projectId: null,
    taskId: null,
    retryCount: -1,
    loading: true,
    error: "",
    task: null,
  });

  const taskFromContext = tasks.find((item) => String(item.id) === String(taskId));

  useEffect(() => {
    if (taskFromContext || workspaceLoading || tasksLoading || !project) return undefined;
    let isCurrent = true;

    getProjectTask(projectId, taskId, {
      memberships: project.memberships,
      milestones,
    })
      .then((loadedTask) => {
        if (!isCurrent) return;
        setFetchedTaskState({
          projectId,
          taskId,
          retryCount: retryFetchCount,
          loading: false,
          error: "",
          task: loadedTask,
        });
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setFetchedTaskState({
          projectId,
          taskId,
          retryCount: retryFetchCount,
          loading: false,
          error: formatErrorMessage(requestError, "Failed to load task."),
          task: null,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [
    taskFromContext,
    projectId,
    taskId,
    project,
    milestones,
    workspaceLoading,
    tasksLoading,
    retryFetchCount,
  ]);

  const isFetchedTaskCurrent =
    fetchedTaskState.projectId === projectId &&
    fetchedTaskState.taskId === taskId &&
    fetchedTaskState.retryCount === retryFetchCount;
  const fetchingTask =
    !taskFromContext &&
    !workspaceLoading &&
    !tasksLoading &&
    (!isFetchedTaskCurrent || fetchedTaskState.loading);
  const fetchError =
    !taskFromContext && isFetchedTaskCurrent ? fetchedTaskState.error : "";
  const task =
    taskFromContext ??
    (isFetchedTaskCurrent ? fetchedTaskState.task : null);
  const taskRoute =
    `/projects/${projectId}/workspace/tasks/${taskId}` +
    (asParam ? `?as=${encodeURIComponent(asParam)}` : "");
  const availableMembers = (project.memberships ?? []).filter(
    (member) =>
      (!member.status || member.status === "ACTIVE") &&
      String(member.id) !== String(task?.assigneeMemberId) &&
      (!task?.assignee || member.name !== task.assignee),
  );
  const selectedMember = availableMembers.find(
    (member) => String(member.id) === newOwnerId,
  );
  const milestone = task
    ? milestones.find((item) => String(item.id) === String(task.milestoneId))
    : null;

  const goBack = () => navigate(taskRoute);

  if (workspaceLoading || tasksLoading || fetchingTask) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice variant="info" title="Loading task and project members…" />
      </section>
    );
  }

  if (workspaceError || tasksError || fetchError) {
    const message = workspaceError || tasksError || fetchError;
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="error"
          title="Couldn't load task or project members"
          text={message}
          buttonLabel="Retry"
          onButtonClick={
            workspaceError
              ? retryWorkspace
              : fetchError
                ? () => setRetryFetchCount((c) => c + 1)
                : retryTasks
          }
        />
      </section>
    );
  }

  if (!task) {
    return (
      <section className={styles.page}>
        <EmptyState title="Task not found" text="This task is no longer available.">
          <Button onClick={goBack}>Back to task</Button>
        </EmptyState>
      </section>
    );
  }

  if (!canManageMembers) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="info"
          title="Only an owner or manager can reassign tasks."
          buttonLabel="View task"
          onButtonClick={goBack}
        />
      </section>
    );
  }

  if (saved) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="success"
          title={`Task reassigned to ${selectedMember?.name || "the selected member"}`}
          text={
            error
              ? `Reassignment saved. ${error}`
              : `The task is now assigned to ${selectedMember?.name || "the selected member"}.`
          }
          buttonLabel="View task"
          onButtonClick={goBack}
        />
      </section>
    );
  }

  const handleReview = (event) => {
    event.preventDefault();
    if (!selectedMember) {
      setError("Choose an active project member.");
      return;
    }
    setError("");
    setReviewMode(true);
  };

  const confirmReassignment = async () => {
    if (!selectedMember || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      await updateProjectTask(projectId, taskId, {
        assigneeMemberId: selectedMember.id,
      });
      setSaved(true);
      try {
        await refreshTasks();
      } catch (refreshError) {
        setError(
          `The task was reassigned, but the task list could not be refreshed: ${formatErrorMessage(refreshError)}`,
        );
      }
    } catch (requestError) {
      setError(
        formatErrorMessage(requestError, "Task could not be reassigned."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Reassign task</h2>
      <TaskSummaryCard task={task} milestone={milestone} />

      {error && (
        <Alert variant="error" title="Task owner did not change">
          {error}
        </Alert>
      )}

      {reviewMode ? (
        <div className={styles.reviewCard}>
          <h3 className={styles.reviewTitle}>
            Reassign {task.title} to {selectedMember?.name}?
          </h3>
          <p className={styles.reviewBody}>
            {task.assignee} → {selectedMember?.name}
          </p>
          {handoverNote.trim() && (
            <p className={styles.reviewBody}>
              Handover note (not saved): {handoverNote.trim()}
            </p>
          )}
          <div className={styles.buttonRow}>
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={() => setReviewMode(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={isSaving}
              loadingText="Reassigning…"
              onClick={confirmReassignment}
            >
              Confirm reassignment
            </Button>
          </div>
        </div>
      ) : (
        <form className={styles.formCard} onSubmit={handleReview}>
          <h3 className={styles.sectionTitle}>Reassign task</h3>
          <p className={styles.helper}>
            Current owner: {task.assignee}. Choose one active project member.
          </p>
          <Select
            label="New owner"
            required
            value={newOwnerId}
            options={availableMembers.map((member) => ({
              value: String(member.id),
              label: `${member.name || "Project member"}${member.role ? ` · ${member.role}` : ""}`,
            }))}
            placeholder={error ? "Not selected" : "Select a new owner"}
            onChange={(event) => {
              setNewOwnerId(event.target.value);
              setError("");
            }}
            error={error && !newOwnerId ? error : ""}
          />
          <Input
            label="Handover note"
            value={handoverNote}
            onChange={(event) => setHandoverNote(event.target.value)}
            helperText="This endpoint does not save handover notes."
          />
          <div className={styles.buttonRow}>
            <Button type="button" variant="secondary" onClick={goBack}>
              Cancel
            </Button>
            <Button type="submit">Review reassignment</Button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ReassignTask;
