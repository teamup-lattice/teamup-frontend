import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Textarea from "../../../../components/Textarea";
import { requestHandover, requestNewDate } from "../../../../services/workspaceService";
import { useSimulate } from "../../useSimulate";
import { useWorkspace } from "../../useWorkspace";
import { SEP, addDays, formatDate, shortDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./Reminders.module.css";

const APOS = "\u2019";
// Mock "today" so the Figma examples (12 Nov 2026) stay stable.
const MOCK_TODAY = "2026-11-12";

function chipClass(status) {
  if (status === "Blocked") return styles.blocked;
  if (status === "In review") return styles.review;
  return styles.neutral;
}

function statusLabel(status) {
  return status === "Blocked" ? `! ${status}` : status;
}

function Reminders() {
  const { project, milestones, tasks, currentUser } = useWorkspace();
  const { projectId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();

  const [doneIds, setDoneIds] = useState([]);
  const [mode, setMode] = useState("list"); // list | date | handover
  const [form, setForm] = useState({ date: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | error | sent
  const [sent, setSent] = useState(null); // { type, date, message }
  const [doneNote, setDoneNote] = useState("");
  const errorRef = useRef(null);

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  const mine = tasks.filter(
    (t) => t.assignee === currentUser.name && t.status !== "Done" && !doneIds.includes(t.id),
  );
  const overdue = simulate === "empty" ? [] : mine.filter((t) => (t.overdueDays ?? 0) > 0);
  const tomorrow = addDays(MOCK_TODAY, 1);
  const dueTomorrow =
    simulate === "empty" ? [] : mine.filter((t) => t.dueDate === tomorrow && !(t.overdueDays > 0));

  const task = overdue[0];
  const milestoneOf = (t) => milestones.find((m) => m.id === t.milestoneId);
  const taskPath = (t) => `/projects/${projectId}/workspace/tasks/${t.id}${search}`;
  const tasksPath = `/projects/${projectId}/workspace/tasks${search}`;
  const owner = project.ownerName;
  const isSending = status === "sending";

  function openForm(nextMode) {
    setMode(nextMode);
    setForm({ date: "", message: "" });
    setErrors({});
    setStatus("idle");
  }

  function cancelForm() {
    setMode("list");
    setErrors({});
    setStatus("idle");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function markDone(target) {
    setDoneIds((ids) => [...ids, target.id]);
    setDoneNote(`${target.title} is marked Done.`);
  }

  async function handleSend(event) {
    event.preventDefault();
    if (mode === "date" && !form.date) {
      setErrors({ date: "Choose the date you propose." });
      document.getElementById("reminder-date").focus();
      return;
    }

    setStatus("sending");
    const send = mode === "date" ? requestNewDate : requestHandover;
    try {
      await send(
        { taskId: task.id, ...form },
        { simulateFail: simulate === "fail" },
      );
      setSent({ type: mode, date: form.date, message: form.message.trim() });
      setMode("list");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const header = (
    <>
      <h2 className={shared.title}>Reminders</h2>
      <p className={shared.description}>Choose your next step.</p>
    </>
  );

  // Request form (new date or handover)
  if (mode !== "list" && task) {
    const isDate = mode === "date";
    return (
      <div>
        {header}
        <form className={shared.card} onSubmit={handleSend} noValidate>
          <h3 className={shared.cardTitle}>{isDate ? "Request a new date" : "Hand it over"}</h3>
          <p className={shared.small}>
            {task.title}
            {SEP}
            {isDate ? `Stored due ${formatDate(task.dueDate)}` : `Due ${formatDate(task.dueDate)}`}
          </p>

          {isSending && (
            <>
              <Alert variant="info" title={isDate ? "Sending date request..." : "Sending handover request..."}>
                {isDate
                  ? `Your proposed ${shortDate(form.date)} date and message are retained. Stored due date stays ${shortDate(task.dueDate)} until a saved Owner change.`
                  : `Your message is retained. ${task.title} stays with ${task.assignee} until the Owner reassigns it.`}
              </Alert>
              <div className={shared.skeleton} />
            </>
          )}
          {status === "error" && (
            <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
              <Alert
                variant="error"
                title={isDate ? "Date request did not send" : "Handover request did not send"}
              >
                {`${isDate ? `Your ${shortDate(form.date)} proposal and message remain local. ` : "Your message remains local. "}${task.title} is still ${task.assignee}${APOS}s. ${task.status} and overdue.`}
              </Alert>
            </div>
          )}

          {isDate && (
            <Input
              id="reminder-date"
              name="date"
              type="date"
              label="Proposed due date"
              required
              value={form.date}
              onChange={handleChange}
              error={errors.date}
              disabled={isSending}
            />
          )}
          <Textarea
            id="reminder-message"
            name="message"
            label={`Message to ${owner}`}
            value={form.message}
            onChange={handleChange}
            disabled={isSending}
          />

          <div className={shared.stack}>
            <Button
              type="submit"
              fullWidth
              loading={isSending}
              loadingText="Sending request..."
            >
              {status === "error"
                ? "Retry request"
                : isDate
                  ? "Send date request"
                  : "Send handover request"}
            </Button>
            <button type="button" className={shared.linkButton} onClick={cancelForm}>
              Cancel local changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Request sent: pending confirmation
  if (status === "sent" && sent && task) {
    const milestone = milestoneOf(task);
    return (
      <div>
        {header}
        {sent.type === "date" ? (
          <>
            <Alert variant="success" title="Date requested">
              {`Proposed ${shortDate(sent.date)} sent to ${owner}. No new deadline is saved yet.`}
            </Alert>
            <section className={shared.card}>
              <h3 className={shared.cardTitle}>{task.title}</h3>
              <p className={shared.text}>
                Owner: {task.assignee}
                {SEP}
                {task.status}
              </p>
              <p className={shared.text}>
                Stored due: {shortDate(task.dueDate)}
                {SEP}
                {task.milestoneId}
              </p>
              <p className={shared.text}>
                Overdue {task.overdueDays} days{SEP}Milestone {task.milestoneId} {milestone?.name}
              </p>
              <p className={shared.text}>
                Request pending{SEP}Proposed {shortDate(sent.date)}
              </p>
              <p className={shared.helper}>Waiting for a saved Owner decision.</p>
              <Button fullWidth variant="secondary" onClick={() => navigate(taskPath(task))}>
                View request
              </Button>
            </section>
          </>
        ) : (
          <>
            <Alert variant="success" title="Handover requested">
              {`${owner} can review a separate manual assignment. Sending this request does not release your role.`}
            </Alert>
            <section className={shared.card}>
              <h3 className={shared.cardTitle}>
                {task.title} remains with {task.assignee}
              </h3>
              <p className={shared.text}>
                {task.status}
                {SEP}Due {shortDate(task.dueDate)}
                {SEP}
                {task.milestoneId}
              </p>
              {sent.message && <p className={shared.text}>Message: &ldquo;{sent.message}&rdquo;</p>}
              <Button fullWidth variant="secondary" onClick={() => navigate(taskPath(task))}>
                View task
              </Button>
              <p className={shared.helper}>
                Only a successful Owner reassignment changes the task owner.
              </p>
            </section>
          </>
        )}
      </div>
    );
  }

  // Default list
  const nothing = overdue.length === 0 && dueTomorrow.length === 0;

  return (
    <div>
      {header}

      {doneNote && (
        <Alert variant="success" title="Task marked done">
          {doneNote}
        </Alert>
      )}

      {nothing && (
        <>
          <Alert variant="info" title="No due reminders right now">
            No reminders. Saved tasks and statuses unchanged.
          </Alert>
          <Button fullWidth variant="secondary" onClick={() => navigate(tasksPath)}>
            View my tasks
          </Button>
        </>
      )}

      {overdue.length > 0 && (
        <section aria-labelledby="overdue-title">
          <h3 id="overdue-title" className={shared.sectionTitle}>
            Overdue task
          </h3>
          {overdue.map((item) => (
            <article key={item.id} className={shared.card}>
              <div className={styles.chips}>
                <span className={`${styles.chip} ${chipClass(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
                <span className={`${styles.chip} ${styles.overdue}`}>
                  Overdue {item.overdueDays} days
                </span>
              </div>
              <h4 className={shared.cardTitle}>{item.title}</h4>
              <div className={shared.person}>
                <span className={shared.avatar} aria-hidden="true">
                  {item.assignee.charAt(0)}
                </span>
                <span className={shared.small}>Owner: {item.assignee}</span>
              </div>
              <p className={shared.small}>
                Due {formatDate(item.dueDate)}
                {SEP}Milestone: {item.milestoneId} {milestoneOf(item)?.name}
              </p>
              {item.blockerNote && (
                <p className={shared.text}>Blocker note: {item.blockerNote}</p>
              )}
              <div className={shared.stack}>
                <Button fullWidth variant="secondary" onClick={() => markDone(item)}>
                  Mark done
                </Button>
                <button type="button" className={shared.linkButton} onClick={() => openForm("date")}>
                  Request new date
                </button>
                <button type="button" className={shared.linkButton} onClick={() => openForm("handover")}>
                  Hand it over
                </button>
              </div>
            </article>
          ))}
          <p className={shared.helper}>
            Update status or request a date change or handover from {owner}, the Owner.
            Evidence optional.
          </p>
        </section>
      )}

      {dueTomorrow.length > 0 && (
        <section className={shared.card} aria-labelledby="tomorrow-title">
          <h3 id="tomorrow-title" className={shared.cardTitle}>
            Due tomorrow
          </h3>
          <p className={shared.small}>Reminder{SEP}{formatDate(tomorrow)}</p>
          {dueTomorrow.map((item) => (
            <article key={item.id} className={styles.inner}>
              <div className={styles.chips}>
                <span className={`${styles.chip} ${chipClass(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <h4 className={shared.cardTitle}>{item.title}</h4>
              <div className={shared.person}>
                <span className={shared.avatar} aria-hidden="true">
                  {item.assignee.charAt(0)}
                </span>
                <span className={shared.small}>Owner: {item.assignee}</span>
              </div>
              <p className={shared.small}>
                Due {formatDate(item.dueDate)}
                {SEP}Milestone: {item.milestoneId} {milestoneOf(item)?.name}
              </p>
              {item.note && <p className={shared.text}>{item.note}</p>}
              <p className={shared.helper}>
                {item.title}
                {SEP}
                {item.status}
                {SEP}Due {shortDate(item.dueDate)}
              </p>
              <Button fullWidth variant="secondary" onClick={() => navigate(taskPath(item))}>
                Open {item.title}
              </Button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default Reminders;
