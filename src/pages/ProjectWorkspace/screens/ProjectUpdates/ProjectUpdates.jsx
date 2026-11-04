import { useEffect, useRef, useState } from "react";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Textarea from "../../../../components/Textarea";
import { postUpdate } from "../../../../services/workspaceService";
import { useSimulate } from "../../useSimulate";
import { useWorkspace } from "../../useWorkspace";
import { SEP, formatDate, numberWord } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./ProjectUpdates.module.css";

function ProjectUpdates() {
  const { updates, currentUser } = useWorkspace();
  const simulate = useSimulate();
  const [thread, setThread] = useState(() => (simulate === "empty" ? [] : updates));
  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | posting | error | posted
  const errorRef = useRef(null);

  const isPosting = status === "posting";
  const hasDraft = draft.trim() !== "";
  const showWriteAnother = status === "posted" && !hasDraft;
  const existing = `${numberWord(thread.length)} update${thread.length === 1 ? "" : "s"}`;

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  function handleChange(event) {
    setDraft(event.target.value);
    setFieldError("");
    if (status === "posted") setStatus("idle");
  }

  async function handlePost(event) {
    event.preventDefault();
    if (!hasDraft) {
      setFieldError("Write an update before posting.");
      document.getElementById("update-message").focus();
      return;
    }

    setStatus("posting");
    try {
      await postUpdate(draft.trim(), { simulateFail: simulate === "fail" });
      const now = new Date();
      setThread((current) => [
        {
          author: currentUser.name,
          date: now.toISOString().slice(0, 10),
          time: now.toTimeString().slice(0, 5),
          message: draft.trim(),
        },
        ...current,
      ]);
      setDraft("");
      setStatus("posted");
    } catch {
      setStatus("error");
    }
  }

  function writeAnother() {
    setStatus("idle");
    document.getElementById("update-message").focus();
  }

  let helper = "";
  if (isPosting) helper = "Temporarily locked while saving. Your draft is retained.";
  else if (hasDraft) helper = `Local draft${SEP}Not posted`;

  return (
    <div>
      <h2 className={shared.title}>Updates</h2>
      <p className={shared.description}>
        Share a project update with your accepted team.
      </p>

      <form className={shared.card} onSubmit={handlePost} noValidate>
        <h3 className={shared.cardTitle}>Write an update</h3>

        {thread.length === 0 && status === "idle" && (
          <Alert variant="info" title="No updates yet">
            Start the project thread. Everyone on the accepted team can read and post.
          </Alert>
        )}
        {isPosting && (
          <Alert variant="info" title="Posting update...">
            Posting. Draft retained; post temporarily locked.
          </Alert>
        )}
        {status === "error" && (
          <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
            <Alert variant="error" title="Update did not post">
              Your draft is retained below. The existing {existing}{" "}
              {thread.length === 1 ? "is" : "are"} unchanged.
            </Alert>
          </div>
        )}
        {status === "posted" && (
          <Alert variant="success" title="Update posted">
            Update posted. Draft cleared.
          </Alert>
        )}

        <Textarea
          id="update-message"
          label="Project update"
          value={draft}
          onChange={handleChange}
          error={fieldError}
          disabled={isPosting}
          helperText={helper || undefined}
        />

        {showWriteAnother ? (
          <Button fullWidth variant="secondary" onClick={writeAnother}>
            Write another update
          </Button>
        ) : (
          <Button
            type="submit"
            fullWidth
            loading={isPosting}
            loadingText="Posting update..."
          >
            {status === "error" ? "Retry post" : "Post update"}
          </Button>
        )}
      </form>

      {thread.length > 0 && (
        <section aria-labelledby="thread-title">
          <h3 id="thread-title" className={shared.sectionTitle}>
            Project thread
          </h3>
          <ul className={styles.thread}>
            {thread.map((update, index) => (
              <li
                key={`${update.author}-${update.date}-${update.time ?? ""}-${index}`}
                className={shared.card}
              >
                <div className={shared.person}>
                  <span className={shared.avatar} aria-hidden="true">
                    {update.author.charAt(0)}
                  </span>
                  <span className={shared.text}>{update.author}</span>
                </div>
                <p className={shared.small}>
                  {formatDate(update.date)}
                  {update.time ? `${SEP}${update.time}` : ""}
                </p>
                <p className={shared.text}>{update.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default ProjectUpdates;
