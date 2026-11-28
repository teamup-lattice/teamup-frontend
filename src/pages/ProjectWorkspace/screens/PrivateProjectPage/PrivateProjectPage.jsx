import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import privateProjectImage from "../../../../assets/private-project.png";
import { getErrorMessage } from "../../../../services/errorMessage";
import {
  getPrivateProjectPage,
  saveOwnProfileChoice,
} from "../../../../services/privateProjectPageService";
import { useSimulate } from "../../useSimulate";
import { useWorkspace } from "../../useWorkspace";
import { SEP, formatDate, shortDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import ContributionsSection from "./ContributionsSection";
import DeliverablesCard from "./DeliverablesCard";
import PrivacyProfileCard from "./PrivacyProfileCard";
import TeamCard from "./TeamCard";
import styles from "./PrivateProjectPage.module.css";

const LOAD_VARIANTS = ["fail", "notcompleted"];

function PrivateProjectPage() {
  const { currentUser } = useWorkspace();
  const { projectId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();
  const variant = LOAD_VARIANTS.includes(simulate) ? simulate : null;

  const [attempt, setAttempt] = useState(0);
  const requestKey = `${projectId}|${variant}|${attempt}`;
  const [loaded, setLoaded] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let isCurrent = true;
    getPrivateProjectPage(projectId, { variant })
      .then((data) => {
        if (isCurrent) setLoaded({ key: requestKey, data, error: "" });
      })
      .catch((error) => {
        console.error("Failed to load private project page:", error);
        if (isCurrent) {
          setLoaded({
            key: requestKey,
            data: null,
            error: getErrorMessage(error, {
              fallback: "Something went wrong. Try again.",
            }),
          });
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [projectId, variant, requestKey]);

  const isLoading = loaded.key !== requestKey;
  const data = isLoading ? null : loaded.data;
  const workspacePath = `/projects/${projectId}/workspace`;

  if (isLoading) {
    return (
      <div className={styles.page} aria-busy="true">
        <span className={styles.srOnly} role="status">
          Loading private project page…
        </span>

        {/* Header: title + meta */}
        <div className={styles.skeletonHeader}>
          <span className={`${styles.skeletonBar} ${styles.skeletonTitle}`} />
          <span className={`${styles.skeletonBar} ${styles.skeletonMeta}`} />
        </div>

        {/* Hero image */}
        <span className={`${styles.skeletonBar} ${styles.skeletonHero}`} />

        {/* Status row: pill + text */}
        <div className={styles.skeletonStatusRow}>
          <span className={`${styles.skeletonBar} ${styles.skeletonPill}`} />
          <span className={`${styles.skeletonBar} ${styles.skeletonStatusText}`} />
        </div>

        {/* Description bar */}
        <span className={`${styles.skeletonBar} ${styles.skeletonDesc}`} />

        {/* Two-column layout */}
        <div className={styles.skeletonLayout}>
          {/* Left column */}
          <div className={styles.skeletonColumn}>
            {/* Overview card */}
            <div className={styles.skeletonCardInner}>
              <span className={`${styles.skeletonBar} ${styles.skeletonCardTitle}`} />
              <span className={`${styles.skeletonBar} ${styles.skeletonRowFull}`} />
              <span className={`${styles.skeletonBar} ${styles.skeletonRowMedium}`} />
              <span className={`${styles.skeletonBar} ${styles.skeletonRowShort}`} />
              {/* Nested: Collective outcome card */}
              <div className={styles.skeletonNestedCard}>
                <span className={`${styles.skeletonBar} ${styles.skeletonCardTitle}`} />
                <span className={`${styles.skeletonBar} ${styles.skeletonRowFull}`} />
                <span className={`${styles.skeletonBar} ${styles.skeletonRowMedium}`} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className={styles.skeletonColumn}>
            {/* Team card */}
            <div className={styles.skeletonCardInner}>
              <span className={`${styles.skeletonBar} ${styles.skeletonCardTitle}`} />
              {/* Member row 1 */}
              <div className={styles.skeletonPersonRow}>
                <span className={`${styles.skeletonBar} ${styles.skeletonAvatar}`} />
                <div className={styles.skeletonPersonMeta}>
                  <span className={`${styles.skeletonBar} ${styles.skeletonRowMedium}`} />
                  <span className={`${styles.skeletonBar} ${styles.skeletonRowShort}`} />
                </div>
              </div>
              {/* Member row 2 */}
              <div className={styles.skeletonPersonRow}>
                <span className={`${styles.skeletonBar} ${styles.skeletonAvatar}`} />
                <div className={styles.skeletonPersonMeta}>
                  <span className={`${styles.skeletonBar} ${styles.skeletonRowMedium}`} />
                  <span className={`${styles.skeletonBar} ${styles.skeletonRowShort}`} />
                </div>
              </div>
              <span className={`${styles.skeletonBar} ${styles.skeletonRowFull}`} />
            </div>
            {/* Privacy/profile card */}
            <div className={styles.skeletonCardInner}>
              <span className={`${styles.skeletonBar} ${styles.skeletonCardTitle}`} />
              <span className={`${styles.skeletonBar} ${styles.skeletonRowFull}`} />
              <span className={`${styles.skeletonBar} ${styles.skeletonButton}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loaded.error || !data) {
    return (
      <div>
        <h2 className={shared.title}>Private project page</h2>
        <Alert variant="error" title="Couldn't load the private project page">
          {loaded.error || "Something went wrong. Try again."}
        </Alert>
        <Button fullWidth onClick={() => setAttempt((count) => count + 1)}>
          Retry
        </Button>
      </div>
    );
  }

  const { project, team, deliverables, contributions, sharing } = data;

  if (project.status !== "Completed") {
    return (
      <div>
        <h2 className={shared.title}>Private project page</h2>
        <div className={styles.message}>
          <Alert variant="info" title="Project page not available yet">
            {project.name} is still {project.status}. The private project page is created when the
            Owner completes the project.
          </Alert>
        </div>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate(`${workspacePath}/completion${search}`)}
        >
          Go to Project completion
        </Button>
      </div>
    );
  }

  const weeks = project.durationWeeks
    ? `${project.durationWeeks} ${project.durationWeeks === 1 ? "week" : "weeks"}`
    : "";
  const range =
    project.startDate && project.endDate
      ? `${shortDate(project.startDate)}–${shortDate(project.endDate)}`
      : "";
  const dateLine = [
    project.endDate ? formatDate(project.endDate) : "",
    range,
    weeks,
  ]
    .filter(Boolean)
    .join(SEP);
  const otherNames = team.members
    .map((member) => member.name)
    .filter((name) => name !== currentUser.name);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Private project page</h2>
        {dateLine && <p className={styles.metaLine}>{dateLine}</p>}
      </header>

      <img
        className={styles.hero}
        src={privateProjectImage}
        alt={`${project.name} project`}
      />

      <p className={styles.badges}>
        <span className={styles.completedTag}>
          <span aria-hidden="true">{"✓"}</span> Completed
        </span>
        <span className={styles.visibility}>
          {project.visibility}
          {SEP}
          {project.audience}
        </span>
      </p>
      <p className={styles.intro}>Project outcome and individual contributions.</p>

      <div className={styles.layout}>
        <div className={styles.column}>
          <section className={shared.card} aria-labelledby="page-overview-title">
            <h3 id="page-overview-title" className={shared.cardTitle}>
              Overview
            </h3>
            <p className={styles.cardBody}>{project.overview}</p>
            <h4 className={styles.subTitle}>The problem</h4>
            <p className={styles.cardBody}>{project.problem}</p>
          </section>

          <section className={shared.card} aria-labelledby="page-outcome-title">
            <h3 id="page-outcome-title" className={shared.cardTitle}>
              Collective outcome
            </h3>
            <p className={styles.cardBody}>{project.outcome}</p>
            {(project.completedOn || range || weeks) && (
              <p className={shared.small}>
                {[
                  project.completedOn
                    ? `Completed ${formatDate(project.completedOn)}`
                    : "",
                  range,
                  weeks,
                ]
                  .filter(Boolean)
                  .join(SEP)}
              </p>
            )}
          </section>
        </div>

        <div className={styles.column}>
          <TeamCard team={team} />
          <PrivacyProfileCard
            sharing={sharing}
            viewerName={currentUser.name}
            otherNames={otherNames}
            onSave={(value) =>
              saveOwnProfileChoice(value, { simulateFail: simulate === "profilefail" })
            }
            onOpenSharing={() => navigate(`${workspacePath}/sharing-privacy${search}`)}
          />
        </div>
      </div>

      <div className={`${styles.column} ${styles.below}`}>
        <DeliverablesCard deliverables={deliverables} />
        <div className={styles.actionRow}>
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/projects/${projectId}/workspace/contributions`)
            }
          >
            My contribution
          </Button>
        </div>
        <ContributionsSection
          contributions={contributions}
          taskPath={(taskId) => `${workspacePath}/tasks/${taskId}${search}`}
        />
      </div>
    </div>
  );
}

export default PrivateProjectPage;
