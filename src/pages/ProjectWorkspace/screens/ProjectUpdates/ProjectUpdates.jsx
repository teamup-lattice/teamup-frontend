import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Textarea from "../../../../components/Textarea";
import { postProjectUpdate } from "../../../../services/projectUpdatesService";
import { getErrorMessage } from "../../../../services/errorMessage";
import { useWorkspace } from "../../useWorkspace";
import { SEP, formatDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./ProjectUpdates.module.css";

const MAX_UPDATE_LENGTH = 5000;

function ProjectUpdates() {
  const { projectId } = useParams();
  const {
    updates,
    updatesLoading,
    updatesError,
    retryUpdates,
    addUpdate,
  } = useWorkspace();
  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [postError, setPostError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | posting | error | posted
  const errorRef = useRef(null);

  const isPosting = status === "posting";
  const hasDraft = draft.trim() !== "";
  const showWriteAnother = status === "posted" && !hasDraft;
  const characterCount = `${draft.length}/${MAX_UPDATE_LENGTH}`;

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  function handleChange(event) {
    setDraft(event.target.value);
    setFieldError("");
    setPostError("");
    if (status === "posted" || status === "error") setStatus("idle");
  }

  async function handlePost(event) {
    event.preventDefault();
    if (!hasDraft) {
      setFieldError("Write an update before posting.");
      document.getElementById("update-message").focus();
      return;
    }

    setPostError("");
    setStatus("posting");
    try {
      const update = await postProjectUpdate(projectId, draft.trim());
      addUpdate(update);
      setDraft("");
      setStatus("posted");
    } catch (error) {
      setPostError(
        getErrorMessage(error, {
          fallback: "Something went wrong. Try again.",
        }),
      );
      setStatus("error");
    }
  }

  function writeAnother() {
    setStatus("idle");
    document.getElementById("update-message").focus();
  }

  let helper = `${characterCount} characters`;
  if (isPosting) {
    helper = `Temporarily locked while saving. ${characterCount} characters. Your draft is retained.`;
  } else if (hasDraft) {
    helper = `${characterCount} characters${SEP}Local draft, not posted`;
  }

  return (
    <div>
      <h2 className={shared.title}>Updates</h2>
      <p className={shared.description}>
        Share a project update with your accepted team.
      </p>

      <form className={shared.card} onSubmit={handlePost} noValidate>
        <h3 className={shared.cardTitle}>Write an update</h3>

        {isPosting && (
          <Alert variant="info" title="Posting update...">
            Posting. Draft retained; post temporarily locked.
          </Alert>
        )}
        {status === "error" && (
          <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
            <Alert variant="error" title="Update did not post">
              {postError} Your draft is retained below.
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
          maxLength={MAX_UPDATE_LENGTH}
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

      <section aria-labelledby="thread-title">
        <h3 id="thread-title" className={shared.sectionTitle}>
          Project thread
        </h3>

        {updatesLoading && (
          <Alert variant="info" title="Loading updates...">
            Fetching the latest project updates.
          </Alert>
        )}

        {!updatesLoading && updatesError && (
          <div className={shared.errorWrap}>
            <Alert variant="error" title="Couldn't load updates">
              {updatesError}
            </Alert>
            <Button variant="secondary" fullWidth onClick={retryUpdates}>
              Retry
            </Button>
          </div>
        )}

        {!updatesLoading && !updatesError && updates.length === 0 && (
          <Alert variant="info" title="No updates yet">
            Start the project thread. Everyone on the accepted team can read and
            post.
          </Alert>
        )}

        {!updatesLoading && !updatesError && updates.length > 0 && (
          <ul className={styles.thread}>
            {updates.map((update) => (
              <li key={update.id} className={shared.card}>
                <div className={shared.person}>
                  <span className={shared.avatar} aria-hidden="true">
                    {(update.author || "?").charAt(0)}
                  </span>
                  <span className={shared.text}>{update.author}</span>
                </div>
                {update.date && (
                  <p className={shared.small}>
                    {formatDate(update.date)}
                    {update.time ? `${SEP}${update.time}` : ""}
                  </p>
                )}
                <p className={shared.text}>{update.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default ProjectUpdates;
