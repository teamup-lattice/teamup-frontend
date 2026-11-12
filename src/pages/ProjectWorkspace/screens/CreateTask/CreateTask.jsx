import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import Skeleton from "../../../../components/Skeleton";
import { createProjectTask, getTaskApiStatus } from "../../../../services/tasksService";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import styles from "./CreateTask.module.css";

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

const defaultForm = {
  title: "",
  assigneeMemberId: "",
  dueDate: "",
  milestoneId: "",
  status: "To do",
  description: "",
};

function CreateTask() {
  const { projectId } = useParams();
  const {
    canManageMembers,
    project,
    members = [],
    milestones,
    milestonesLoading,
    milestonesError,
    retryMilestones,
    refreshTasks,
    workspaceLoading,
    workspaceError,
    retryWorkspace,
  } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const asParam = new URLSearchParams(location.search).get("as");

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const workspacePath = `/projects/${projectId}/workspace`;
  const tasksPath = `${workspacePath}/tasks`;
  const taskRoute = `${tasksPath}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;

  const availableMemberships =
    (project?.memberships && project.memberships.length > 0)
      ? project.memberships
      : members;

  const assigneeOptions = availableMemberships
    .filter((member) => !member.status || member.status === "ACTIVE")
    .map((member) => ({
      value: String(member.id),
      label: `${member.name || "Project member"}${member.role ? ` · ${member.role}` : ""}`,
    }));

  const handleFieldChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSubmitError("");
  };

  const resetDraft = () => {
    setForm(defaultForm);
    setErrors({});
    navigate(taskRoute);
  };

  const submitTask = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Enter a task title.";
    } else if (form.title.trim().length > 200) {
      nextErrors.title = "Task titles must be 200 characters or fewer.";
    }
    if (!assigneeOptions.some((member) => member.value === form.assigneeMemberId)) {
      nextErrors.assigneeMemberId = "Choose an active project member.";
    }
    if (!form.dueDate.trim()) {
      nextErrors.dueDate = "Enter a due date.";
    }
    if (!form.milestoneId || !milestones.some((milestone) => String(milestone.id) === form.milestoneId)) {
      nextErrors.milestoneId = "Choose a project milestone.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitError("");
    setIsSubmitting(true);
    const body = {
      title: form.title.trim(),
      assigneeMemberId: form.assigneeMemberId,
      dueDate: new Date(`${form.dueDate}T00:00:00.000Z`).toISOString(),
      milestoneId: form.milestoneId,
      status: getTaskApiStatus(form.status),
    };
    const description = form.description.trim();
    if (description) body.description = description;

    try {
      await createProjectTask(projectId, body);
      try {
        await refreshTasks();
      } catch {
        // The task list retries its own load when it mounts.
      }
      navigate(taskRoute);
    } catch (error) {
      setSubmitError(formatErrorMessage(error, "Task could not be created."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (workspaceLoading || milestonesLoading) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <p role="status">Loading project details…</p>
        <Skeleton />
      </section>
    );
  }

  if (workspaceError || milestonesError) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="error"
          title="Couldn't load task options"
          text={workspaceError || milestonesError}
          buttonLabel="Retry"
          onButtonClick={workspaceError ? retryWorkspace : retryMilestones}
        />
      </section>
    );
  }

  if (!canManageMembers) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="info"
          title="Only an owner or manager can create tasks."
          buttonLabel="View tasks"
          onButtonClick={() => navigate(taskRoute)}
        />
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Create task</h2>
      <p className={styles.helperText}>Choose one active member. Required fields are marked *.</p>

      {submitError && (
        <Alert variant="error" title="Task could not be created">
          {submitError}
        </Alert>
      )}

      <form className={styles.formCard} onSubmit={submitTask}>
        <Input
          label="Task title"
          required
          maxLength={200}
          value={form.title}
          placeholder={errors.title ? "Not entered" : "Task title"}
          onChange={(event) => handleFieldChange("title", event.target.value)}
          error={errors.title}
        />

        <Select
          label="Task owner"
          required
          value={form.assigneeMemberId}
          options={assigneeOptions}
          placeholder={
            errors.assigneeMemberId ? "Not selected" : "Select a task owner"
          }
          onChange={(event) => handleFieldChange("assigneeMemberId", event.target.value)}
          error={errors.assigneeMemberId}
        />

        <Input
          label="Due date"
          type="date"
          required
          value={form.dueDate}
          placeholder={errors.dueDate ? "Not entered" : "Select a date"}
          onChange={(event) => handleFieldChange("dueDate", event.target.value)}
          error={errors.dueDate}
        />

        <Select
          label="Milestone"
          required
          value={form.milestoneId}
          options={milestones.map((milestone) => ({
            value: String(milestone.id),
            label: milestone.name,
          }))}
          placeholder={errors.milestoneId ? "Not selected" : "Select a milestone"}
          onChange={(event) => handleFieldChange("milestoneId", event.target.value)}
          error={errors.milestoneId}
        />

        <Select
          label="Task status"
          required
          value={form.status}
          options={[
            { value: "To do", label: "To do" },
            { value: "In progress", label: "In progress" },
            { value: "In review", label: "In review" },
            { value: "Done", label: "Done" },
            { value: "Blocked", label: "Blocked" },
          ]}
          onChange={(event) => handleFieldChange("status", event.target.value)}
        />

        <Input
          label="Description"
          multiline
          value={form.description}
          onChange={(event) => handleFieldChange("description", event.target.value)}
        />

        <p className={styles.draftHelper}>Task details will be saved to the project.</p>
        <Button type="submit" fullWidth loading={isSubmitting} loadingText="Creating task…">
          Create task
        </Button>
        <button type="button" className={styles.cancelLink} onClick={resetDraft}>
          Cancel local draft
        </button>
        <p className={styles.footerText}>Cancel leaves the task list unchanged.</p>
      </form>
    </section>
  );
}

export default CreateTask;
