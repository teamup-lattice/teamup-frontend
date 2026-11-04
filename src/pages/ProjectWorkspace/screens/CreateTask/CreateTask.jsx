import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import Skeleton from "../../../../components/Skeleton";
import { members } from "../../../../data/workspaceData";
import { useWorkspace } from "../../useWorkspace";
import StateNotice from "../../shared/StateNotice";
import styles from "./CreateTask.module.css";

const defaultForm = {
  title: "Check responsive layouts",
  owner: "David",
  dueDate: "2026-11-16",
  milestone: "M2",
  status: "To do",
  description: "Review phone and tablet layouts before the next prototype review.",
};

function CreateTask() {
  const { projectId } = useParams();
  const { isOwner } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const previewState = searchParams.get("state");
  const asParam = searchParams.get("as");

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const workspacePath = `/projects/${projectId}/workspace`;
  const tasksPath = `${workspacePath}/tasks`;
  const taskRoute = `${tasksPath}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;

  const acceptedMembers = members.filter((member) => member.status === "Accepted");
  const ownerOptions = acceptedMembers.map((member) => ({
    value: member.name,
    label: `${member.name} · ${member.role}`,
  }));

  const handleFieldChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const resetDraft = () => {
    setForm(defaultForm);
    setErrors({});
    setSavedSuccess(false);
    navigate(taskRoute);
  };

  const submitTask = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Enter a task title.";
    }
    if (!form.owner.trim()) {
      nextErrors.owner = "Choose one accepted member.";
    }
    if (!form.dueDate.trim()) {
      nextErrors.dueDate = "Enter a due date.";
    }
    if (!form.milestone.trim()) {
      nextErrors.milestone = "Choose a milestone.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSavedSuccess(true);
  };

  if (!isOwner) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="info"
          title="Members cannot create tasks. Pending invitations do not appear as task owners."
          buttonLabel="View tasks"
          onButtonClick={() => navigate(taskRoute)}
        />
      </section>
    );
  }

  if (previewState === "blank") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="info"
          title="Start a task"
          text="Required: title, accepted owner, due date and milestone. Default status: To do. Description optional."
          buttonLabel="Enter task details"
          onButtonClick={() => navigate(`${tasksPath}/new${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`)}
        />
      </section>
    );
  }

  if (previewState === "creating") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="info"
          title="Creating task…"
          text="Creating task. Draft retained; controls locked. Six saved tasks until confirmed."
        />
        <div className={styles.skeletonGroup}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </section>
    );
  }

  if (previewState === "error") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="error"
          title="Task was not created"
          text="Task not created. Draft and selections retained; six saved tasks unchanged. Retry."
          buttonLabel="Retry create"
          onButtonClick={() => navigate(`${tasksPath}/new${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`)}
        />
      </section>
    );
  }

  if (previewState === "success") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="success"
          title="Task created"
          text="Check responsive layouts · David · 16 Nov · M2 · To do. Now 7 total, 2 Done, 5 not Done; M2 is 0/4."
          buttonLabel="View task"
          onButtonClick={() => navigate(`${tasksPath}/task-7${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`)}
        />
      </section>
    );
  }

  if (savedSuccess) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Create task</h2>
        <StateNotice
          variant="success"
          title="Task created"
          text="Local draft has been created successfully and is ready for review."
          buttonLabel="View task"
          onButtonClick={() => navigate(taskRoute)}
        />
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Create task</h2>
      <p className={styles.helperText}>Choose one accepted member. Required fields are marked *.</p>

      <form className={styles.formCard} onSubmit={submitTask}>
        <Input
          label="Task title"
          required
          value={form.title}
          placeholder={errors.title ? "Not entered" : "Task title"}
          onChange={(event) => handleFieldChange("title", event.target.value)}
          error={errors.title}
        />

        <Select
          label="Task owner"
          required
          value={form.owner}
          options={ownerOptions}
          placeholder={errors.owner ? "Not selected" : "Select a task owner"}
          onChange={(event) => handleFieldChange("owner", event.target.value)}
          error={errors.owner}
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
          value={form.milestone}
          options={[
            { value: "M1", label: "M1 Requirements" },
            { value: "M2", label: "M2 Working prototype" },
            { value: "M3", label: "M3 Final demo" },
          ]}
          placeholder={errors.milestone ? "Not selected" : "Select a milestone"}
          onChange={(event) => handleFieldChange("milestone", event.target.value)}
          error={errors.milestone}
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

        <p className={styles.draftHelper}>Local draft · Not saved. The project still has 6 tasks.</p>
        <Button type="submit" fullWidth>Create task</Button>
        <button type="button" className={styles.cancelLink} onClick={resetDraft}>
          Cancel local draft
        </button>
        <p className={styles.footerText}>No task created. Title and description stay in the local draft.</p>
      </form>
    </section>
  );
}

export default CreateTask;
