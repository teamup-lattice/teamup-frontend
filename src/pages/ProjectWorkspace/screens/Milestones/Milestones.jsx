import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Input from "../../../../components/Input";
import Skeleton from "../../../../components/Skeleton";
import { patchProjectMilestone } from "../../../../services/milestonesService";
import { useWorkspace } from "../../useWorkspace";
import { SEP, formatDate, shortDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./Milestones.module.css";

function statusMark(status) {
  if (status === "Done") return "\u2713";
  if (status === "Blocked") return "!";
  return "\u25cb";
}

function Milestones() {
  const {
    project,
    milestones,
    tasks,
    tasksLoading,
    tasksError,
    retryTasks,
    isOwner,
    setMilestones,
    milestonesLoading,
    milestonesError,
    retryMilestones,
  } = useWorkspace();
  const { projectId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", targetDate: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | saving | error | saved
  const [saveError, setSaveError] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const errorRef = useRef(null);

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  const tasksFor = (milestone) => tasks.filter((t) => t.milestoneId === milestone.id);
  const doneFor = (milestone) => tasksFor(milestone).filter((t) => t.status === "Done").length;
  const tasksPath = `/projects/${projectId}/workspace/tasks${search}`;

  function startEdit(milestone) {
    setEditingId(milestone.id);
    setDraft({ name: milestone.name, targetDate: milestone.targetDate });
    setErrors({});
    setSaveError("");
    setStatus("idle");
  }

  function cancelEdit() {
    setEditingId(null);
    setErrors({});
    setSaveError("");
    setStatus("idle");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSave(event) {
    event.preventDefault();
    const current = milestones.find((milestone) => milestone.id === editingId);
    const found = {};
    if (!draft.name.trim()) found.name = "Enter a milestone name.";
    if (!draft.targetDate && current?.targetDate) {
      found.targetDate = "Choose a target date.";
    }
    setErrors(found);

    const firstInvalid = ["name", "targetDate"].find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`milestone-${firstInvalid}`).focus();
      return;
    }

    if (!current) {
      setSaveError("Milestone is no longer available. Reload the page and try again.");
      setStatus("error");
      return;
    }
    const updatedName = draft.name.trim();
    const changes = {};
    if (updatedName !== current.name) changes.title = updatedName;
    if (draft.targetDate !== current.targetDate) {
      changes.dueDate = new Date(`${draft.targetDate}T00:00:00.000Z`).toISOString();
    }

    if (Object.keys(changes).length === 0) {
      setSavedNote(`${current.name} has no changes to save.`);
      setEditingId(null);
      setStatus("saved");
      return;
    }

    setStatus("saving");
    setSaveError("");
    try {
      await patchProjectMilestone(projectId, editingId, changes);
      setMilestones((list) =>
        list.map((milestone) =>
          milestone.id === editingId
            ? {
                ...milestone,
                name: updatedName,
                targetDate: draft.targetDate,
              }
            : milestone,
        ),
      );
      setSavedNote(
        `${updatedName} milestone saved. Task due dates unchanged; ${
          tasksLoading
            ? "task counts are loading."
            : tasksError
              ? "task counts are unavailable."
              : `${doneFor(current)}/${tasksFor(current).length} Done.`
        }`,
      );
      setEditingId(null);
      setStatus("saved");
    } catch (error) {
      setSaveError(error.message || "Something went wrong. Try again.");
      setStatus("error");
    }
  }

  if (milestonesLoading) {
    return (
      <div>
        <h2 className={shared.title}>Milestones</h2>
        <p role="status">Loading milestones…</p>
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (milestonesError) {
    return (
      <div>
        <h2 className={shared.title}>Milestones</h2>
        <Alert variant="error" title="Couldn't load milestones">
          {milestonesError}
        </Alert>
        <Button fullWidth onClick={retryMilestones}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className={shared.title}>Milestones</h2>
      <p className={shared.description}>
        Task counts show saved progress. {project.ownerName} can edit milestone details.
      </p>

      {status === "saved" && (
        <Alert variant="success" title="Milestone target saved">
          {savedNote}
        </Alert>
      )}

      {milestones.length === 0 && (
        <EmptyState
          title="No milestones yet"
          text="No milestones have been added to this project."
        />
      )}

      <div className={shared.cards}>
        {milestones.map((milestone) => {
          const linked = tasksFor(milestone);
          const done = doneFor(milestone);

          if (isOwner && editingId === milestone.id) {
            return (
              <form
                key={milestone.id}
                className={shared.card}
                onSubmit={handleSave}
                noValidate
              >
                {status === "error" && (
                  <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
                    <Alert variant="error" title="Milestone did not save">
                      {`${saveError} ${milestone.id} stays ${milestone.targetDate ? formatDate(milestone.targetDate) : "without a target date"} with ${done}/${linked.length} Done. Your proposed ${draft.targetDate ? shortDate(draft.targetDate) : "no target date"} is retained locally.`}
                    </Alert>
                  </div>
                )}
                <Input
                  id="milestone-name"
                  name="name"
                  label="Milestone name"
                  required
                  value={draft.name}
                  onChange={handleChange}
                  error={errors.name}
                  disabled={status === "saving"}
                />
                <Input
                  id="milestone-targetDate"
                  name="targetDate"
                  type="date"
                  label="Target date"
                  value={draft.targetDate}
                  onChange={handleChange}
                  error={errors.targetDate}
                  disabled={status === "saving"}
                />
                <p className={shared.small}>
                  Stored target: {milestone.targetDate ? formatDate(milestone.targetDate) : "Not set"}
                  <br />
                  Proposed target: {draft.targetDate ? formatDate(draft.targetDate) : "Not chosen"}
                  <br />
                  Linked tasks: {linked.length}
                  {SEP}Done: {done}
                </p>
                <p className={shared.helper}>
                  Changing the milestone target does not automatically change linked
                  task due dates.
                </p>
                <div className={shared.stack}>
                  <Button
                    type="submit"
                    fullWidth
                    loading={status === "saving"}
                    loadingText="Saving milestones..."
                  >
                    {status === "error" ? "Retry date save" : "Save milestones"}
                  </Button>
                  <button type="button" className={shared.linkButton} onClick={cancelEdit}>
                    Cancel local changes
                  </button>
                </div>
              </form>
            );
          }

          return (
            <section
              key={milestone.id}
              className={shared.card}
              aria-labelledby={`milestone-${milestone.id}`}
            >
              <h3 id={`milestone-${milestone.id}`} className={shared.cardTitle}>
                {milestone.name}
              </h3>
              <p className={styles.progress}>
                {tasksLoading
                  ? "Loading task counts…"
                  : tasksError
                    ? "Task counts unavailable"
                    : `${done} / ${linked.length} Done`}
              </p>
              <p className={shared.small}>
                Target: {milestone.targetDate ? formatDate(milestone.targetDate) : "Not set"}
              </p>
              {tasksError && (
                <Alert variant="error" title="Couldn't load linked tasks">
                  {tasksError}
                </Alert>
              )}
              {tasksError && (
                <Button variant="secondary" onClick={retryTasks}>
                  Retry task counts
                </Button>
              )}
              <ul className={shared.list}>
                {!tasksLoading && !tasksError && linked.map((task) => (
                  <li key={task.id} className={shared.text}>
                    {task.title}
                    {isOwner ? `${SEP}${task.assignee}` : ""}
                    {SEP}
                    {statusMark(task.status)} {task.status}
                  </li>
                ))}
              </ul>

              {isOwner ? (
                <div className={shared.stack}>
                  <button
                    type="button"
                    className={shared.linkButton}
                    onClick={() => navigate(tasksPath)}
                  >
                    View linked tasks
                  </button>
                  <Button fullWidth variant="secondary" onClick={() => startEdit(milestone)}>
                    Edit milestone
                  </Button>
                </div>
              ) : (
                <div className={shared.stack}>
                  <Button fullWidth variant="secondary" onClick={() => navigate(tasksPath)}>
                    View linked tasks
                  </Button>
                  <p className={shared.helper}>Only the Owner can edit milestones.</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default Milestones;
