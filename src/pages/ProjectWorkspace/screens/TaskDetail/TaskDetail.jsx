import { useEffect, useRef, useState } from "react";
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
import {
  normalizeHttpUrl,
  typeFromFile,
  uploadEvidenceFile,
} from "../../../../services/evidenceService";
import { getErrorMessage } from "../../../../services/errorMessage";
import {
  decideDateExtensionRequest,
  getDateExtensionRequests,
} from "../../../../services/dateExtensionsService";
import { formatDate } from "../../../CreateProject/formatDate";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import TaskSummaryCard from "../../shared/TaskSummaryCard";
import DateExtensionBanner from "./DateExtensionBanner";
import styles from "./TaskDetail.module.css";

const taskStatusOptions = [
  { value: "To do", label: "To do" },
  { value: "In progress", label: "In progress" },
  { value: "In review", label: "In review" },
  { value: "Done", label: "Done" },
  { value: "Blocked", label: "Blocked" },
];

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
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadedFileType, setUploadedFileType] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
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
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");
  const [decidingRequestId, setDecidingRequestId] = useState(null);
  const [decisionError, setDecisionError] = useState("");
  const [decisionSuccess, setDecisionSuccess] = useState("");
  const fileInputRef = useRef(null);

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
        setEvidenceFile(null);
        setUploadedFileUrl("");
        setUploadedFileType("");
        setFileError("");
        setStatusError("");
        setSuccessMessage("");
        setNoChangesNotice(false);
        setDecisionError("");
        setDecisionSuccess("");
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
          error: getErrorMessage(error, {
            fallback: "Something went wrong. Try again.",
          }),
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
          error: getErrorMessage(error, {
            fallback: "Something went wrong. Try again.",
          }),
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

  useEffect(() => {
    if (!canManageMembers || !project || !task) {
      setPendingRequests([]);
      setRequestsLoading(false);
      setRequestsError("");
      return undefined;
    }

    let isCurrent = true;
    setRequestsLoading(true);
    setRequestsError("");

    getDateExtensionRequests(projectId, {
      status: "PENDING",
      taskId,
    })
      .then((requests) => {
        if (!isCurrent) return;
        setPendingRequests(requests);
        setRequestsLoading(false);
      })
      .catch(() => {
        if (!isCurrent) return;
        setPendingRequests([]);
        setRequestsError("Unable to load pending date requests.");
        setRequestsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [canManageMembers, project, projectId, task, taskId]);

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

  const clearFileSelection = () => {
    setEvidenceFile(null);
    setUploadedFileUrl("");
    setUploadedFileType("");
    setFileError("");
  };

  const resetStatusForm = () => {
    setStatus(task.status);
    setBlockerNote(task.blockerNote);
    setCompletionNote("");
    setArtifactUrl("");
    clearFileSelection();
    setStatusError("");
    setSuccessMessage("");
    setNoChangesNotice(false);
  };

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFilePicked = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFileError("Files must be 10 MB or smaller.");
      return;
    }

    setEvidenceFile(file);
    setUploadedFileUrl("");
    setUploadedFileType("");
    setFileError("");
    setSuccessMessage("");
    setNoChangesNotice(false);
  };

  const removeFile = () => {
    clearFileSelection();
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

    const savingToDone = status === "Done" && task.status !== "Done";

    setStatusSaving(true);
    setStatusError("");
    setSuccessMessage("");
    setNoChangesNotice(false);
    setFileError("");
    try {
      let fileUrl = uploadedFileUrl;
      let fileType = uploadedFileType;

      if (savingToDone && evidenceFile && !fileUrl) {
        setFileUploading(true);
        try {
          fileUrl = await uploadEvidenceFile(evidenceFile);
          fileType = typeFromFile(evidenceFile);
          setUploadedFileUrl(fileUrl);
          setUploadedFileType(fileType);
        } catch (error) {
          setFileError(
            getErrorMessage(error, { fallback: "File could not be uploaded." }),
          );
          return;
        } finally {
          setFileUploading(false);
        }
      }

      const changes = {};
      if (status !== task.status) {
        changes.status = getTaskApiStatus(status);
      }
      if (status === "Blocked") {
        if (
          changes.status === "BLOCKED" ||
          blockerNote.trim() !== task.blockerNote
        ) {
          changes.blockerNote = blockerNote.trim();
        }
      }
      // GAP: a contribution is only sent when this save moves the task to Done.
      // Resending one for an already Done task depends on the backend PATCH
      // behaviour and may create a duplicate contribution row.
      if (savingToDone) {
        const contribution = {};
        if (completionNote.trim()) {
          contribution.completionNote = completionNote.trim();
        }
        if (artifactUrl.trim()) {
          contribution.artifactUrl = artifactUrl.trim();
        }
        if (fileUrl) {
          contribution.fileUrl = fileUrl;
          contribution.fileType = fileType || "DOCUMENT";
        }
        if (Object.keys(contribution).length > 0) {
          contribution.title = (task.title || "").slice(0, 200);
          changes.contribution = contribution;
        }
      }

      if (Object.keys(changes).length === 0) {
        setNoChangesNotice(true);
        return;
      }

      await updateProjectTask(projectId, taskId, changes);
      const updatedTask = await getProjectTask(projectId, taskId, {
        memberships: project.memberships,
        milestones,
      });
      setStatus(updatedTask.status);
      setBlockerNote(updatedTask.blockerNote);
      setCompletionNote("");
      setArtifactUrl("");
      clearFileSelection();
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
          `Task saved, but the task list could not be refreshed: ${getErrorMessage(refreshErr, { fallback: "Something went wrong. Try again." })}`,
        );
      }
    } catch (error) {
      setStatusError(
        getErrorMessage(error, { fallback: "Task status did not save." }),
      );
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
      setCommentError(
        getErrorMessage(error, { fallback: "Comment could not be posted." }),
      );
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
        error: getErrorMessage(error, {
          fallback: "Comments could not be refreshed.",
        }),
      }));
      setCommentError(
        `Comment posted, but comments could not be refreshed: ${getErrorMessage(error, { fallback: "Something went wrong. Try again." })}`,
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
        getErrorMessage(error, { fallback: "Task could not be deleted." }),
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
        getErrorMessage(error, { fallback: "Comment could not be updated." }),
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
        getErrorMessage(error, { fallback: "Comment could not be deleted." }),
      );
    } finally {
      setCommentActionLoadingId(null);
    }
  };

  const refetchPendingRequests = async () => {
    try {
      const requests = await getDateExtensionRequests(projectId, {
        status: "PENDING",
        taskId,
      });
      setPendingRequests(requests);
    } catch {
      setPendingRequests([]);
    }
  };

  const handleDecide = async (request, decision, decisionNote) => {
    if (decidingRequestId !== null || !project) return;

    setDecidingRequestId(request.id);
    setDecisionError("");
    setDecisionSuccess("");

    try {
      await decideDateExtensionRequest(projectId, request.id, {
        status: decision,
        decisionNote,
      });

      setPendingRequests((current) =>
        current.filter((item) => String(item.id) !== String(request.id)),
      );

      if (decision === "ACCEPTED") {
        try {
          const updatedTask = await getProjectTask(projectId, taskId, {
            memberships: project.memberships,
            milestones,
          });

          setStatus(updatedTask.status);
          setBlockerNote(updatedTask.blockerNote);
          setCompletionNote("");
          setArtifactUrl("");
          clearFileSelection();
          setStatusError("");
          setSuccessMessage("");
          setNoChangesNotice(false);
          setTaskState({
            projectId,
            taskId,
            retryCount: detailRetryCount,
            loading: false,
            error: "",
            task: updatedTask,
          });

          const deadline = formatDate(updatedTask.dueDate);
          setDecisionSuccess(
            deadline
              ? `Request accepted. The deadline is now ${deadline}.`
              : "Request accepted.",
          );
        } catch {
          setDecisionSuccess(
            "Request accepted. Refresh the page to see the new deadline.",
          );
        }

        try {
          await refreshTasks();
        } catch {
          setDecisionSuccess((current) =>
            current
              ? `${current} The task list could not be refreshed.`
              : "Request accepted, but the task list could not be refreshed.",
          );
        }
      } else {
        setDecisionSuccess("Request declined.");
      }
    } catch (error) {
      setDecisionError(
        getErrorMessage(error, {
          fallback: "We couldn't save your decision. Try again.",
          byStatus: {
            409: "This request has already been handled.",
            403: "You don't have permission to decide this request.",
            404: "This request no longer exists.",
          },
        }),
      );
      if (Number(error?.status) === 409) {
        await refetchPendingRequests();
      }
    } finally {
      setDecidingRequestId(null);
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
              if (event.target.value !== "Done") clearFileSelection();
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
              {task.status !== "Done" && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={styles.hiddenInput}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={handleFilePicked}
                  />
                  {evidenceFile ? (
                    <div className={styles.fileRow}>
                      <span className={styles.fileName}>
                        {evidenceFile.name}
                      </span>
                      <button
                        type="button"
                        className={styles.removeFile}
                        disabled={fileUploading || statusSaving}
                        onClick={removeFile}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      disabled={fileUploading || statusSaving}
                      onClick={openFilePicker}
                    >
                      Choose file
                    </Button>
                  )}
                  {uploadedFileUrl && !fileUploading && (
                    <p className={styles.metaLine}>
                      File uploaded. It is saved with this task status.
                    </p>
                  )}
                  {fileError && (
                    <Alert variant="error" title="File could not be uploaded">
                      {fileError}
                    </Alert>
                  )}
                  <p className={styles.metaLine}>
                    Files up to 10 MB. Images, PDF, docs and zip are accepted.
                  </p>
                </>
              )}
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
                Completion notes, links and files are optional.
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

      {decisionError && (
        <Alert variant="error" title="Decision not saved">
          {decisionError}
        </Alert>
      )}
      {decisionSuccess && (
        <Alert variant="success" title="Date request updated">
          {decisionSuccess}
        </Alert>
      )}
      {!requestsLoading &&
        !requestsError &&
        pendingRequests.map((request) => (
          <DateExtensionBanner
            key={request.id}
            request={request}
            currentDueDate={task.dueDate}
            deciding={decidingRequestId !== null}
            onDecide={(status, decisionNote) =>
              handleDecide(request, status, decisionNote)
            }
          />
        ))}

      <TaskSummaryCard task={task} milestone={milestone} />
      {task.createdBy && (
        <p className={styles.metaLine}>Created by {task.createdBy}</p>
      )}
      {task.contributions.length > 0 && (
        <div className={styles.panel}>
          <h3 className={styles.sectionTitle}>Contributions</h3>
          {task.contributions.map((contribution, index) => {
            const safeArtifactUrl = normalizeHttpUrl(contribution.artifactUrl);
            const safeFileUrl = normalizeHttpUrl(contribution.fileUrl);
            return (
              <div className={styles.comment} key={contribution.id || index}>
                <strong>{contribution.title || "Completed work"}</strong>
                {contribution.completionNote && (
                  <p>{contribution.completionNote}</p>
                )}
                {safeArtifactUrl && (
                  <p>
                    <a href={safeArtifactUrl} target="_blank" rel="noreferrer">
                      View contribution
                    </a>
                  </p>
                )}
                {safeFileUrl && (
                  <p>
                    <a href={safeFileUrl} target="_blank" rel="noreferrer">
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
            );
          })}
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
