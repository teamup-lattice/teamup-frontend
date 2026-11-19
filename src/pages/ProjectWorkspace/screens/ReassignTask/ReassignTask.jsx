import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import {
  acceptHandoverRequest,
  declineHandoverRequest,
  getHandoverRequests,
} from "../../../../services/handoverService";
import { getProjectTask, updateProjectTask } from "../../../../services/tasksService";
import { getErrorMessage } from "../../../../services/errorMessage";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import TaskSummaryCard from "../../shared/TaskSummaryCard";
import styles from "./ReassignTask.module.css";

function getActionErrorMessage(error, fallback) {
  return getErrorMessage(error, {
    fallback,
    byStatus: { 409: "This request has already been decided." },
  });
}

function extractHandoverRequests(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.requests)) return response.requests;
  if (Array.isArray(response?.handoverRequests)) return response.handoverRequests;
  return [];
}

function getRequestTaskId(request) {
  if (!request) return undefined;
  if (request.taskId != null) return request.taskId;
  if (request.task?.id != null) return request.task.id;
  if (typeof request.task === "string") return request.task;
  return undefined;
}

function getRequesterName(request) {
  if (!request) return "";
  const directCandidates = [
    request.requesterName,
    request.requestedByName,
    request.requestedByMemberName,
    request.memberName,
    typeof request.requester === "string" ? request.requester : "",
    typeof request.requestedBy === "string" ? request.requestedBy : "",
    typeof request.requestedByMember === "string" ? request.requestedByMember : "",
    request.requester?.name,
    request.requester?.fullName,
    request.requester?.user?.name,
    request.requester?.user?.fullName,
    request.requestedBy?.name,
    request.requestedBy?.fullName,
    request.requestedBy?.user?.name,
    request.requestedBy?.user?.fullName,
    request.requestedByMember?.name,
    request.requestedByMember?.fullName,
    request.member?.name,
    request.member?.fullName,
    request.user?.name,
    request.user?.fullName,
  ];
  const name = directCandidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );
  return name ? name.trim() : "";
}

function getRequesterMemberId(request) {
  if (!request) return "";
  const candidates = [
    request.requesterMemberId,
    request.requestedByMemberId,
    request.memberId,
    request.requesterMember?.id,
    request.requestedByMember?.id,
    request.requestedBy?.memberId,
    request.requester?.memberId,
    request.requester?.id,
    request.requestedBy?.id,
    request.member?.id,
    request.user?.memberId,
    request.user?.id,
  ];
  const id = candidates.find(
    (candidate) => candidate != null && String(candidate).trim() !== "",
  );
  return id == null ? "" : String(id);
}

function getHandoverNote(request) {
  if (!request) return "";
  const candidates = [
    request.note,
    request.handoverNote,
    request.message,
    request.reason,
  ];
  const note = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );
  return note ? note.trim() : "";
}

function isPendingRequest(request) {
  if (!request) return false;
  if (!request.status) return true;
  return String(request.status).toUpperCase() === "PENDING";
}

function ReassignTask() {
  const { projectId, taskId } = useParams();
  const {
    canManageMembers,
    isOwner,
    project,
    members,
    membersLoading,
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
  const [doneState, setDoneState] = useState(null);
  const [retryFetchCount, setRetryFetchCount] = useState(0);
  const [handoverRetryCount, setHandoverRetryCount] = useState(0);
  const [fetchedTaskState, setFetchedTaskState] = useState({
    projectId: null,
    taskId: null,
    retryCount: -1,
    loading: true,
    error: "",
    task: null,
  });
  const [handoverState, setHandoverState] = useState({
    projectId: null,
    taskId: null,
    retryCount: -1,
    loading: true,
    error: "",
    request: null,
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
          error: getErrorMessage(requestError, {
            fallback: "Failed to load task.",
          }),
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

  useEffect(() => {
    let isCurrent = true;

    getHandoverRequests(projectId, { status: "PENDING" })
      .then((response) => {
        if (!isCurrent) return;
        const match = extractHandoverRequests(response).find(
          (request) =>
            String(getRequestTaskId(request)) === String(taskId) &&
            isPendingRequest(request),
        );
        setHandoverState({
          projectId,
          taskId,
          retryCount: handoverRetryCount,
          loading: false,
          error: "",
          request: match ?? null,
        });
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setHandoverState({
          projectId,
          taskId,
          retryCount: handoverRetryCount,
          loading: false,
          error: getErrorMessage(requestError, {
            fallback: "Couldn't load pending handover requests.",
          }),
          request: null,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, taskId, handoverRetryCount]);

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
  const isHandoverCurrent =
    handoverState.projectId === projectId &&
    handoverState.taskId === taskId &&
    handoverState.retryCount === handoverRetryCount;
  const handoverLoading = !isHandoverCurrent || handoverState.loading;
  const handoverError = isHandoverCurrent ? handoverState.error : "";
  const pendingRequest = isHandoverCurrent ? handoverState.request : null;
  const requesterId = getRequesterMemberId(pendingRequest);
  const requesterName = getRequesterName(pendingRequest);
  const requesterDisplayName = requesterName || "A teammate";
  const requesterNote = getHandoverNote(pendingRequest);
  const requestId = pendingRequest?.id ?? pendingRequest?.requestId;
  const taskRoute =
    `/projects/${projectId}/workspace/tasks/${taskId}` +
    (asParam ? `?as=${encodeURIComponent(asParam)}` : "");
  const membershipStatusById = new Map(
    (project.memberships ?? [])
      .filter((member) => member?.id != null)
      .map((member) => [
        String(member.id),
        typeof member.status === "string" ? member.status.toUpperCase() : "",
      ]),
  );
  const memberList = Array.isArray(members) ? members : [];
  const memberDirectory =
    memberList.length > 0 ? memberList : (project.memberships ?? []);
  const assigneeMemberId =
    task?.assigneeMemberId != null ? String(task.assigneeMemberId) : "";
  const availableMembers = memberDirectory.filter((member) => {
    const memberId = member.id != null ? String(member.id) : "";
    const memberUserId =
      member.userId != null ? String(member.userId) : "";
    const status =
      (typeof member.status === "string"
        ? member.status.toUpperCase()
        : "") ||
      membershipStatusById.get(memberId) ||
      "";

    if (status && status !== "ACTIVE") return false;
    if (assigneeMemberId && memberId === assigneeMemberId) return false;
    if (
      requesterId &&
      (memberId === requesterId || memberUserId === requesterId)
    ) {
      return false;
    }
    if (!requesterId && requesterName && member.name === requesterName) {
      return false;
    }
    return true;
  });
  const selectedMember = availableMembers.find(
    (member) => String(member.id) === newOwnerId,
  );
  const milestone = task
    ? milestones.find((item) => String(item.id) === String(task.milestoneId))
    : null;

  const goBack = () => navigate(taskRoute);

  const completeAction = async (title, message) => {
    setDoneState({ title, message });
    try {
      await refreshTasks();
    } catch (refreshError) {
      setError(
        `The change was saved, but the task list could not be refreshed: ${getErrorMessage(refreshError, { fallback: "Something went wrong. Try again." })}`,
      );
      return;
    }
    goBack();
  };

  if (
    workspaceLoading ||
    membersLoading ||
    tasksLoading ||
    fetchingTask ||
    handoverLoading
  ) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="info"
          title="Loading task, project members, and handover requests…"
        />
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

  if (doneState) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Reassign task</h2>
        <StateNotice
          variant="success"
          title={doneState.title}
          text={error ? `Saved. ${error}` : doneState.message}
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
      await completeAction(
        `Task reassigned to ${selectedMember.name}`,
        `The task is now assigned to ${selectedMember.name}.`,
      );
    } catch (requestError) {
      setError(
        getActionErrorMessage(requestError, "Task could not be reassigned."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const acceptRequest = async (event) => {
    event.preventDefault();
    if (!selectedMember) {
      setError("Choose an active project member.");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      await acceptHandoverRequest(projectId, requestId, {
        assigneeMemberId: selectedMember.id,
        handoverNote,
      });
      await completeAction(
        `Task reassigned to ${selectedMember.name}`,
        `The handover request was accepted and the task is now assigned to ${selectedMember.name}.`,
      );
    } catch (requestError) {
      setError(
        getActionErrorMessage(
          requestError,
          "The handover request could not be accepted.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const declineRequest = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      await declineHandoverRequest(projectId, requestId);
      await completeAction(
        "Handover request declined",
        `The handover request from ${requesterDisplayName} was declined.`,
      );
    } catch (requestError) {
      setError(
        getActionErrorMessage(
          requestError,
          "The handover request could not be declined.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Reassign task</h2>
      <TaskSummaryCard task={task} milestone={milestone} />

      {handoverError && (
        <>
          <Alert variant="warning" title="Couldn't load handover requests">
            {handoverError}
          </Alert>
          <div className={styles.buttonRow}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setHandoverRetryCount((count) => count + 1)}
            >
              Retry handover request
            </Button>
          </div>
        </>
      )}

      {error && (
        <Alert variant="error" title="Task owner did not change">
          {error}
        </Alert>
      )}

      {pendingRequest ? (
        <>
          <div className={styles.reviewCard}>
            <h3 className={styles.sectionTitle}>Handover request pending</h3>
            <p className={styles.reviewBody}>
              <strong>{requesterDisplayName}</strong> asked to take over this task.
            </p>
            {requesterNote && (
              <p className={styles.reviewBody}>
                Their note: {requesterNote}
              </p>
            )}
          </div>

          {isOwner ? (
            <form className={styles.formCard} onSubmit={acceptRequest}>
              <h3 className={styles.sectionTitle}>Accept and reassign</h3>
              <p className={styles.helper}>
                Current owner: {task.assignee}. Choose one active project member
                other than {requesterDisplayName}.
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
                maxLength={1000}
                multiline
                rows={4}
                onChange={(event) => setHandoverNote(event.target.value)}
                helperText={`${handoverNote.length}/1000 characters`}
              />
              <div className={styles.buttonRow}>
                <Button
                  type="button"
                  variant="secondary"
                  loading={isSaving}
                  loadingText="Declining…"
                  disabled={isSaving}
                  onClick={declineRequest}
                >
                  Decline request
                </Button>
                <Button
                  type="submit"
                  loading={isSaving}
                  loadingText="Accepting…"
                  disabled={isSaving}
                >
                  Accept and reassign
                </Button>
              </div>
            </form>
          ) : (
            <div className={styles.reviewCard}>
              <h3 className={styles.sectionTitle}>Request review</h3>
              <p className={styles.reviewBody}>
                Only the project owner can accept this handover request. You can
                still decline it.
              </p>
              <div className={styles.buttonRow}>
                <Button
                  type="button"
                  variant="secondary"
                  loading={isSaving}
                  loadingText="Declining…"
                  disabled={isSaving}
                  onClick={declineRequest}
                >
                  Decline request
                </Button>
              </div>
            </div>
          )}
        </>
      ) : reviewMode ? (
        <div className={styles.reviewCard}>
          <h3 className={styles.reviewTitle}>
            Reassign {task.title} to {selectedMember?.name}?
          </h3>
          <p className={styles.reviewBody}>
            {task.assignee} → {selectedMember?.name}
          </p>
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
