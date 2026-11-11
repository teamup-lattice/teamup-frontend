import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AvatarGroup from "../../../../components/AvatarGroup";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Skeleton from "../../../../components/Skeleton";
import Textarea from "../../../../components/Textarea";
import teamHealthData from "../../../../data/teamHealthData";
import shared from "../shared.module.css";
import styles from "./TeamHealth.module.css";

function TeamHealth() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const previewState = searchParams.get("state");
  const asParam = searchParams.get("as");

  const resolveLoadStatus = (state) => {
    if (state === "loading") return "loading";
    if (state === "error") return "error";
    if (state === "empty") return "empty";
    return "ready";
  };

  const resolvePanelMode = (state) => {
    if (state === "follow-up" || state === "followUp") return "followUp";
    if (state === "confirm-release" || state === "confirmRelease") {
      return "confirmRelease";
    }
    if (state === "release-failed" || state === "releaseFailed") {
      return "releaseFailed";
    }
    if (state === "released") return "released";
    if (state === "success" || state === "checkInPosted") {
      return "checkInPosted";
    }
    return "default";
  };

  const [loadStatus, setLoadStatus] = useState(() =>
    resolveLoadStatus(previewState),
  );
  const [panelMode, setPanelMode] = useState(() =>
    resolvePanelMode(previewState),
  );
  const [draftCheckIn, setDraftCheckIn] = useState(
    teamHealthData.weeklyCheckIn.postedText,
  );
  const [postedCheckIn, setPostedCheckIn] = useState(
    teamHealthData.weeklyCheckIn.postedText,
  );
  const [followUpMessage, setFollowUpMessage] = useState(
    teamHealthData.followUp.message,
  );

  const workspacePath = `/projects/${projectId}/workspace`;
  const workspaceHref = (path) =>
    `${workspacePath}${path}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;
  const pageTitle = <h2 className={shared.title}>Team health &amp; check-ins</h2>;

  const renderStatusChip = (label, tone) => (
    <span key={label} className={`${styles.statusChip} ${styles[tone]}`}>
      {label}
    </span>
  );

  const renderTeamHealthCard = ({ isEmpty = false } = {}) => (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>Team health</h3>
      {!isEmpty && (
        <span className={`${styles.statusChip} ${styles.needsAttention}`}>
          ! Needs attention
        </span>
      )}

      {isEmpty ? (
        <p className={styles.statusUnavailable}>{teamHealthData.empty.teamHealth}</p>
      ) : (
        <>
          <p className={styles.bodyText}>
            A shared team view, not an assessment of individual members.
          </p>
          <div className={styles.statusRow}>
            {teamHealthData.statusLevels.map(({ label, tone }) =>
              renderStatusChip(label, tone),
            )}
          </div>
          <p className={styles.helperText}>
            Team status levels · No individual scores or rankings
          </p>
        </>
      )}
    </article>
  );

  const renderSharedProgressCard = () => (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>Shared progress</h3>
      <p className={styles.summaryStats}>
        {teamHealthData.overviewSummary.taskCount}
      </p>
      <p className={styles.bodyText}>
        {teamHealthData.overviewSummary.status}
      </p>
      <AvatarGroup
        label="Accepted teammates"
        items={["A", "D", "J"]}
      />
      <p className={styles.memberMeta}>{teamHealthData.overviewSummary.teammates}</p>
      <Button variant="secondary" onClick={() => navigate(workspaceHref("/tasks"))}>
        View tasks
      </Button>
    </article>
  );

  const renderOwnerPromptCard = () => (
    <article className={styles.card}>
      <p className={styles.eyebrow}>{teamHealthData.ownerPrompt.eyebrow}</p>
      <h3 className={styles.cardTitle}>{teamHealthData.ownerPrompt.title}</h3>
      <p className={styles.bodyText}>{teamHealthData.ownerPrompt.description}</p>
      <div className={styles.actionRow}>
        <Button onClick={() => setPanelMode("followUp")}>Follow up</Button>
        <Button variant="secondary" onClick={() => setPanelMode("confirmRelease")}>
          Release role
        </Button>
      </div>
      <p className={styles.helperText}>{teamHealthData.ownerPrompt.helper}</p>
    </article>
  );

  const renderWeeklyCheckInCard = () => (
    <article className={`${styles.card} ${styles.purpleCard}`}>
      <p className={styles.eyebrow}>{teamHealthData.weeklyCheckIn.eyebrow}</p>
      <h3 className={styles.cardTitle}>{teamHealthData.weeklyCheckIn.title}</h3>
      <p className={styles.bodyText}>{teamHealthData.weeklyCheckIn.description}</p>
      <Button onClick={() => navigate(workspaceHref("/updates"))}>
        Open team Updates
      </Button>
    </article>
  );

  const renderUpdatesCard = () => (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>Updates · Team thread</h3>

      {panelMode === "checkInPosted" && (
        <div className={styles.compactAlert}>
          <Alert variant="success" title={teamHealthData.checkInPosted.title}>
            {teamHealthData.checkInPosted.message}
          </Alert>
        </div>
      )}

      {panelMode === "checkInPosted" ? (
        <div className={styles.threadEntry}>
          <p className={styles.entryHeader}>
            <strong className={styles.entryAuthor}>
              {teamHealthData.checkInPosted.label}
            </strong>
          </p>
          <p className={styles.entryText}>{postedCheckIn}</p>
        </div>
      ) : loadStatus === "empty" ? (
        <div className={styles.emptyUpdatesBox}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <span className={styles.emptyIconLine} />
            <span className={styles.emptyIconLine} />
            <span className={styles.emptyIconLine} />
          </div>
          <p className={styles.emptyTitle}>{teamHealthData.noCheckIns.title}</p>
          <p className={styles.emptyText}>{teamHealthData.noCheckIns.text}</p>
          <Button onClick={() => document.getElementById("weekly-checkin")?.focus()}>
            {teamHealthData.noCheckIns.button}
          </Button>
        </div>
      ) : (
        <div className={styles.threadList}>
          {teamHealthData.weeklyCheckIn.updates.map((entry) => (
            <div className={styles.threadEntry} key={`${entry.author}-${entry.date}`}>
              <p className={styles.entryHeader}>
                <strong className={styles.entryAuthor}>{entry.author}</strong>
                <span className={styles.entryDate}> · {entry.date}</span>
              </p>
              <p className={styles.entryText}>{entry.message}</p>
            </div>
          ))}
        </div>
      )}

      {panelMode === "checkInPosted" ? (
        <Button variant="secondary" onClick={() => navigate(workspaceHref("/updates"))}>
          View team thread
        </Button>
      ) : (
        <>
          <Textarea
            id="weekly-checkin"
            label={teamHealthData.weeklyCheckIn.textareaLabel}
            value={draftCheckIn}
            onChange={(event) => setDraftCheckIn(event.target.value)}
            helperText={teamHealthData.weeklyCheckIn.helperText}
          />
          <Button onClick={() => {
            setPostedCheckIn(draftCheckIn);
            setDraftCheckIn("");
            setPanelMode("checkInPosted");
          }}>
            Post check-in
          </Button>
        </>
      )}
    </article>
  );

  const renderFollowUpCard = () => (
    <section className={styles.page}>
      {pageTitle}
      <div className={styles.singleColumnState}>
        {renderTeamHealthCard()}
        <article className={styles.card}>
          <p className={styles.eyebrow}>{teamHealthData.followUp.eyebrow}</p>
          <h3 className={styles.cardTitle}>{teamHealthData.followUp.title}</h3>
          <p className={styles.bodyText}>{teamHealthData.followUp.description}</p>
          <Textarea
            label={teamHealthData.followUp.textareaLabel}
            value={followUpMessage}
            onChange={(event) => setFollowUpMessage(event.target.value)}
            helperText={teamHealthData.followUp.helperText}
          />
          <div className={styles.actionRow}>
            <Button>Send follow-up</Button>
            <Button variant="secondary" onClick={() => setPanelMode("default")}>
              Cancel
            </Button>
          </div>
        </article>
        <p className={styles.footerText}>{teamHealthData.followUp.footer}</p>
      </div>
    </section>
  );

  const renderConfirmReleaseCard = () => (
    <section className={styles.page}>
      {pageTitle}
      <div className={styles.singleColumnState}>
        {renderTeamHealthCard()}
        <article className={styles.card}>
          <p className={styles.eyebrow}>{teamHealthData.release.eyebrow}</p>
          <h3 className={styles.cardTitle}>{teamHealthData.release.title}</h3>
          {teamHealthData.release.paragraphs.map((paragraph) => (
            <p className={styles.bodyText} key={paragraph}>
              {paragraph}
            </p>
          ))}
          <div className={styles.actionRow}>
            <Button variant="secondary" onClick={() => setPanelMode("default")}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setPanelMode("released")}>
              Confirm release
            </Button>
          </div>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => setPanelMode("followUp")}
          >
            Follow up instead
          </button>
        </article>
        <p className={styles.footerText}>{teamHealthData.release.footer}</p>
      </div>
    </section>
  );

  const renderReleaseFailedCard = () => (
    <section className={styles.page}>
      {pageTitle}
      <div className={styles.singleColumnState}>
        {renderTeamHealthCard()}
        <article className={styles.card}>
          <div className={styles.compactAlert}>
            <Alert variant="error" title={teamHealthData.releaseFailed.title}>
              {teamHealthData.releaseFailed.message}
            </Alert>
          </div>
          <h3 className={styles.cardTitle}>{teamHealthData.release.title}</h3>
          {teamHealthData.release.paragraphs.map((paragraph) => (
            <p className={styles.bodyText} key={paragraph}>
              {paragraph}
            </p>
          ))}
          <div className={styles.actionRow}>
            <Button variant="secondary" onClick={() => setPanelMode("default")}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setPanelMode("released")}>
              Retry role release
            </Button>
          </div>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => setPanelMode("followUp")}
          >
            Follow up instead
          </button>
        </article>
        <p className={styles.footerText}>{teamHealthData.release.footer}</p>
      </div>
    </section>
  );

  const renderReleasedCard = () => (
    <section className={styles.page}>
      {pageTitle}
      <div className={styles.singleColumnState}>
        {renderTeamHealthCard()}
        <article className={styles.card}>
          <div className={styles.compactAlert}>
            <Alert variant="success" title={teamHealthData.releaseReleased.title}>
              {teamHealthData.releaseReleased.message}
            </Alert>
          </div>
          <p className={styles.bodyText}>{teamHealthData.releaseReleased.description}</p>
          <Button onClick={() => navigate(workspaceHref("/team"))}>View team roles</Button>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => navigate(workspaceHref("/contributions"))}
          >
            View contribution history
          </button>
        </article>
        <p className={styles.footerText}>{teamHealthData.releaseReleased.footer}</p>
      </div>
    </section>
  );

  if (loadStatus === "loading") {
    return (
      <section className={styles.page} aria-live="polite">
        {pageTitle}
        <div className={styles.loadingWrap}>
          <div className={styles.compactAlert}>
            <Alert variant="info" title={teamHealthData.loading.title}>
              {teamHealthData.loading.description}
            </Alert>
          </div>
          <p className={styles.loadingHelper}>{teamHealthData.loading.helper}</p>
          <div className={styles.loadingCards}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        </div>
      </section>
    );
  }

  if (loadStatus === "error") {
    return (
      <section className={styles.page}>
        {pageTitle}
        <div className={styles.singleColumnState}>
          <div className={styles.compactAlert}>
            <Alert variant="error" title={teamHealthData.error.title}>
              {teamHealthData.error.message}
            </Alert>
          </div>
          <Button variant="secondary" onClick={() => setLoadStatus("ready")}>
            Retry
          </Button>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>{teamHealthData.error.updatesTitle}</h3>
            <p className={styles.bodyText}>{teamHealthData.error.updatesText}</p>
            <Button variant="secondary" onClick={() => navigate(workspaceHref("/updates"))}>
              Open team Updates
            </Button>
          </article>
        </div>
      </section>
    );
  }

  if (panelMode === "followUp") {
    return renderFollowUpCard();
  }

  if (panelMode === "confirmRelease") {
    return renderConfirmReleaseCard();
  }

  if (panelMode === "releaseFailed") {
    return renderReleaseFailedCard();
  }

  if (panelMode === "released") {
    return renderReleasedCard();
  }

  if (panelMode === "checkInPosted" && loadStatus === "ready") {
    return (
      <section className={styles.page}>
        {pageTitle}
        <div className={styles.layout}>
          <div className={styles.leftColumn}>
            {renderTeamHealthCard()}
            {renderSharedProgressCard()}
            {renderOwnerPromptCard()}
          </div>
          <div className={styles.rightColumn}>
            {renderWeeklyCheckInCard()}
            {renderUpdatesCard()}
          </div>
        </div>
      </section>
    );
  }

  if (loadStatus === "empty") {
    return (
      <section className={styles.page}>
        {pageTitle}
        <div className={styles.layout}>
          <div className={styles.leftColumn}>
            {renderTeamHealthCard({ isEmpty: true })}
            {renderSharedProgressCard()}
          </div>
          <div className={styles.rightColumn}>
            {renderWeeklyCheckInCard()}
            {renderUpdatesCard()}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      {pageTitle}
      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          {renderTeamHealthCard()}
          {renderSharedProgressCard()}
          {renderOwnerPromptCard()}
        </div>
        <div className={styles.rightColumn}>
          {renderWeeklyCheckInCard()}
          {renderUpdatesCard()}
        </div>
      </div>
    </section>
  );
}

export default TeamHealth;
