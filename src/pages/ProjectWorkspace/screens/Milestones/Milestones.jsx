import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import { saveMilestone } from "../../../../services/workspaceService";
import { useSimulate } from "../../useSimulate";
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
  const { project, milestones, tasks, isOwner } = useWorkspace();
  const { projectId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();

  const [items, setItems] = useState(() => (simulate === "empty" ? [] : milestones));
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", targetDate: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | saving | error | saved
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
    setStatus("idle");
  }

  function cancelEdit() {
    setEditingId(null);
    setErrors({});
    setStatus("idle");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSave(event) {
    event.preventDefault();
    const found = {};
    if (!draft.name.trim()) found.name = "Enter a milestone name.";
    if (!draft.targetDate) found.targetDate = "Choose a target date.";
    setErrors(found);

    const firstInvalid = ["name", "targetDate"].find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`milestone-${firstInvalid}`).focus();
      return;
    }

    const current = items.find((m) => m.id === editingId);
    setStatus("saving");
    try {
      await saveMilestone(draft, { simulateFail: simulate === "fail" });
      setItems((list) =>
        list.map((m) => (m.id === editingId ? { ...m, ...draft, name: draft.name.trim() } : m)),
      );
      setSavedNote(
        `${current.id} target saved: ${shortDate(draft.targetDate)}. Task due dates unchanged; ${doneFor(current)}/${tasksFor(current).length} Done.`,
      );
      setEditingId(null);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (simulate === "loading") {
    return (
      <div>
        <h2 className={shared.title}>Milestones</h2>
        <Alert variant="info" title="Loading milestones...">
          Loading saved dates and task counts...
        </Alert>
        <div className={shared.skeleton} />
        <div className={shared.skeleton} />
        <Button fullWidth loading loadingText="Loading milestones..." />
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

      {items.length === 0 && (
        <Alert variant="info" title="No milestones yet">
          Owner can create a milestone before linking project tasks. Members have
          read-only access.
        </Alert>
      )}

      <div className={shared.cards}>
        {items.map((milestone) => {
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
                    <Alert variant="error" title="Target date did not save">
                      {`${milestone.id} stays ${formatDate(milestone.targetDate)} with ${done}/${linked.length} Done. Your proposed ${shortDate(draft.targetDate)} is retained locally.`}
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
                  required
                  value={draft.targetDate}
                  onChange={handleChange}
                  error={errors.targetDate}
                  disabled={status === "saving"}
                />
                <p className={shared.small}>
                  Stored target: {formatDate(milestone.targetDate)}
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
                {milestone.id} {milestone.name}
              </h3>
              <p className={styles.progress}>
                {done} / {linked.length} Done
              </p>
              <p className={shared.small}>Target: {formatDate(milestone.targetDate)}</p>
              <ul className={shared.list}>
                {linked.map((task) => (
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
