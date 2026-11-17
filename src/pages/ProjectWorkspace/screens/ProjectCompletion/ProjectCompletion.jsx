import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Skeleton from "../../../../components/Skeleton";
import {
  completeProject,
  getCompletion,
  saveCompletionEvidence,
} from "../../../../services/completionService";
import { useSimulate } from "../../useSimulate";
import { useWorkspace } from "../../useWorkspace";
import shared from "../shared.module.css";
import CompleteCard from "./CompleteCard";
import CompletedCard from "./CompletedCard";
import EvidenceCard from "./EvidenceCard";
import MemberConfirmations from "./MemberConfirmations";
import ReadOnlyBox from "./ReadOnlyBox";
import SavedWorkCard from "./SavedWorkCard";
import {
  APOS,
  AUDIENCE,
  VISIBILITY,
  buildSavedWork,
  capitalize,
  getReadiness,
  projectDatesLine,
} from "./completionHelpers";
import { SEP } from "../../workspaceFormat";
import styles from "./ProjectCompletion.module.css";

const LOAD_VARIANTS = ["missing", "eligible", "failcomplete", "completed", "loadfail"];

function ProjectCompletion() {
  const {
    isOwner,
    currentUser,
    project: workspaceProject,
    milestones,
    tasks,
    workspaceLoading,
    workspaceError,
    milestonesLoading,
    milestonesError,
    tasksLoading,
    tasksError,
    retryWorkspace,
    retryMilestones,
    retryTasks,
  } = useWorkspace();
  const { projectId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const simulate = useSimulate();
  const variant = LOAD_VARIANTS.includes(simulate) ? simulate : null;

  const [attempt, setAttempt] = useState(0);
  const requestKey = `${projectId}|${variant}|${attempt}`;
  const [loaded, setLoaded] = useState({ key: null, data: null, error: "" });

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | error
  const [completeStatus, setCompleteStatus] = useState("idle"); // idle | completing | error
  const [evidenceVersion, setEvidenceVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedNote, setSavedNote] = useState("");
  const [result, setResult] = useState(null); // { visibility, audience } after completing

  // In dev, ?simulate=fail / failcomplete makes the FIRST attempt fail so the
  // retry path can be tried; the next attempt succeeds.
  const failSaveOnce = useRef(simulate === "fail");
  const failCompleteOnce = useRef(simulate === "failcomplete");

  useEffect(() => {
    let isCurrent = true;
    getCompletion(projectId, { variant })
      .then((data) => {
        if (isCurrent) setLoaded({ key: requestKey, data, error: "" });
      })
      .catch((error) => {
        console.error("Failed to load project completion:", error);
        if (isCurrent) {
          setLoaded({
            key: requestKey,
            data: null,
            error: error.message || "Something went wrong. Try again.",
          });
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [projectId, variant, requestKey]);

  const hasContextProject =
    !workspaceLoading &&
    workspaceProject != null &&
    workspaceProject.id != null &&
    workspaceProject.id !== "";
  const savedWorkLoading = milestonesLoading || tasksLoading;
  const loadError = workspaceError || milestonesError || tasksError || loaded.error;

  const retryLoad = () => {
    setAttempt((count) => count + 1);
    if (workspaceError) retryWorkspace();
    if (milestonesError) retryMilestones();
    if (tasksError) retryTasks();
  };
  const isLoading =
    loaded.key !== requestKey ||
    (!workspaceError && !hasContextProject) ||
    savedWorkLoading;
  const data = isLoading ? null : loaded.data;

  const viewContribution = useCallback(() => {
    navigate(`/projects/${projectId}/workspace/contributions${search}`);
  }, [navigate, projectId, search]);

  async function handleSave(evidence) {
    setSaveStatus("saving");
    setSavedNote("");
    const shouldFail = failSaveOnce.current;
    failSaveOnce.current = false;
    try {
      const saved = await saveCompletionEvidence(projectId, evidence, {
        simulateFail: shouldFail,
      });
      setLoaded((current) => ({
        ...current,
        data: { ...current.data, evidence: saved },
      }));
      setEvidenceVersion((version) => version + 1);
      setDirty(false);
      setSaveStatus("idle");
      setSavedNote("Outcome and deliverable saved.");
    } catch (error) {
      console.error("Failed to save completion evidence:", error);
      setSaveStatus("error");
    }
  }

  async function handleComplete() {
    setCompleteStatus("completing");
    const shouldFail = failCompleteOnce.current;
    failCompleteOnce.current = false;
    try {
      const outcome = await completeProject(projectId, { simulateFail: shouldFail });
      setResult({ visibility: outcome.visibility, audience: outcome.audience });
      setCompleteStatus("idle");
    } catch (error) {
      console.error("Failed to complete project:", error);
      setCompleteStatus("error");
    }
  }

  function handleCancel() {
    setDirty(false);
    setSaveStatus("idle");
    setSavedNote("");
  }

  if (isLoading) {
    return (
      <div>
        <h2 className={shared.title}>Project completion</h2>
        <p role="status">Loading project completion…</p>
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div>
        <h2 className={shared.title}>Project completion</h2>
        <Alert variant="error" title="Couldn't load project completion">
          {loadError || "Something went wrong. Try again."}
        </Alert>
        <Button fullWidth onClick={retryLoad}>
          Retry
        </Button>
      </div>
    );
  }

  const { evidence, confirmations } = data;
  const project = workspaceProject ?? {};
  const savedWork = { milestones: buildSavedWork(milestones, tasks) };
  const readiness = getReadiness(evidence, confirmations);
  const mockCompletedPreview = variant === "completed";
  const isCompleted =
    project.status === "Completed" || Boolean(result) || mockCompletedPreview;
  const ownerName = project.ownerName;
  const dates = projectDatesLine(project);
  const pageTo = `/projects/${projectId}/page${search}`;

  const evidenceLine = evidence.deliverable ? `${evidence.deliverable.name}${SEP}Saved` : "";

  // Member (non-Owner) view: read only.
  if (!isOwner) {
    const awaitingMember = readiness.pending.find((item) => item.member === currentUser.name);
    return (
      <div>
        <h2 className={shared.title}>Project completion</h2>
        <p className={shared.small}>{dates}</p>
        <section className={shared.card} aria-label="Project completion, read only">
          <ReadOnlyBox label="Saved final outcome (read only)">{evidence.outcome}</ReadOnlyBox>
          {evidenceLine && <p className={shared.text}>{evidenceLine}</p>}
          <p className={shared.text}>
            {readiness.confirmed.length}/{readiness.total} confirmed
            {awaitingMember
              ? `${SEP}${currentUser.name} Awaiting ${awaitingMember.awaiting}`
              : readiness.pending.length > 0
                ? `${SEP}${readiness.pending
                    .map((item) => `${item.member} Awaiting ${item.awaiting}`)
                    .join(", ")}`
                : ""}
          </p>
          <div className={shared.stack}>
            <Alert
              variant={isCompleted ? "success" : "info"}
              title={isCompleted ? "Project completed" : "Only the Owner can complete"}
            >
              {isCompleted
                ? `${ownerName} completed this project. The page is private and team-only.`
                : `You can view evidence and review your own contribution. ${ownerName} saves final evidence and completes the project.`}
            </Alert>
            <Button variant="secondary" fullWidth onClick={viewContribution}>
              Review my contribution
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Owner view.
  let banner;
  if (isCompleted) {
    banner = (
      <Alert variant="success" title="Project completed">
        Outcome, at least one deliverable and all {readiness.total} member confirmations saved.
      </Alert>
    );
  } else if (readiness.eligible) {
    banner = (
      <Alert variant="info" title="Ready to complete">
        Outcome, deliverable and all {readiness.total} member confirmations saved. Project still In
        Progress.
      </Alert>
    );
  } else {
    const missing = [];
    if (!readiness.hasOutcome) missing.push("a final outcome");
    if (!readiness.hasDeliverable) missing.push("a deliverable");
    const pendingCount = readiness.pending.length;
    const waiting = readiness.pending[0]
      ? `${readiness.pending[0].member} awaits ${readiness.pending[0].awaiting}${APOS}s confirmation. `
      : "";
    const saved =
      missing.length === 0
        ? "Outcome and deliverable saved. "
        : `Add ${missing.join(" and ")}. `;
    banner = (
      <Alert
        variant="info"
        title={
          pendingCount > 0
            ? `${capitalize(pendingCount === 1 ? "one" : String(pendingCount))} confirmation${pendingCount === 1 ? "" : "s"} remaining`
            : "Evidence needed"
        }
      >
        {`${saved}${waiting}Project still ${project.status}.`}
      </Alert>
    );
  }

  return (
    <div>
      <h2 className={shared.title}>Project completion</h2>
      <p className={shared.small}>{dates}</p>

      {savedNote && saveStatus === "idle" && !isCompleted && (
        <div className={styles.banner}>
          <Alert variant="success" title="Evidence saved">
            {savedNote}
          </Alert>
        </div>
      )}

      {!(isCompleted && result) && <div className={styles.banner}>{banner}</div>}

      {isCompleted && result && (
        <div className={styles.banner}>
          <CompletedCard
            projectName={project.name}
            memberCount={readiness.total}
            visibility={result.visibility ?? VISIBILITY}
            audience={result.audience ?? AUDIENCE}
            onViewPage={() => navigate(pageTo)}
          />
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.column}>
          {isCompleted ? (
            <section className={shared.card} aria-labelledby="evidence-title">
              <h3 id="evidence-title" className={shared.cardTitle}>
                Final outcome and deliverables
              </h3>
              <ReadOnlyBox label="Final outcome (completed)">{evidence.outcome}</ReadOnlyBox>
              {evidenceLine && <p className={shared.text}>{evidenceLine}</p>}
              {!result && (
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={() => navigate(pageTo)}>
                    View private project page
                  </Button>
                </div>
              )}
            </section>
          ) : (
            <EvidenceCard
              key={evidenceVersion}
              saved={evidence}
              status={saveStatus}
              locked={completeStatus === "completing"}
              onSave={handleSave}
              onDirtyChange={setDirty}
              onCancel={handleCancel}
            />
          )}
          <SavedWorkCard milestones={savedWork.milestones} />
        </div>

        <div className={styles.column}>
          <MemberConfirmations
            confirmations={confirmations}
            onViewContribution={viewContribution}
          />
          {!isCompleted && (
            <CompleteCard
              readiness={readiness}
              confirmations={confirmations}
              ownerName={ownerName}
              status={completeStatus}
              blocked={saveStatus === "saving" || dirty}
              dirty={dirty}
              onComplete={handleComplete}
              onViewPending={viewContribution}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectCompletion;
