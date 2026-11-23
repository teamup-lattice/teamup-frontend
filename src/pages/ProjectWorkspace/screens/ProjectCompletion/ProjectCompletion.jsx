import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Skeleton from "../../../../components/Skeleton";
import { getCompletion } from "../../../../services/completionService";
import { getErrorMessage } from "../../../../services/errorMessage";
import {
  completeProject,
  getProjectEvidence,
  saveEvidenceDeliverable,
} from "../../../../services/evidenceService";
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

const LOAD_VARIANTS = ["loadfail"];

function completionErrorMessage(error) {
  return getErrorMessage(error, {
    fallback: "Something went wrong. Try again.",
    byStatus: {
      403: "Only the Owner can complete this project.",
      409: error.message || "Project cannot be completed yet.",
    },
  });
}

function ProjectCompletion() {
  const {
    isOwner,
    currentUser,
    project: workspaceProject,
    members,
    milestones,
    tasks,
    workspaceLoading,
    workspaceError,
    membersLoading,
    membersError,
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
  const [completeStatus, setCompleteStatus] = useState("idle"); // idle | completing
  const [completeError, setCompleteError] = useState("");
  const [completeChecks, setCompleteChecks] = useState([]);
  const [evidenceVersion, setEvidenceVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedNote, setSavedNote] = useState("");
  const [outcome, setOutcome] = useState("");
  const [result, setResult] = useState(null); // { visibility, audience } after completing

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      getCompletion(projectId, { variant, members, tasks }),
      getProjectEvidence(projectId),
    ])
      .then(([completion, deliverables]) => {
        if (isCurrent) {
          setLoaded({
            key: requestKey,
            data: { confirmations: completion.confirmations, deliverables },
            error: "",
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load project completion:", error);
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
  }, [projectId, variant, requestKey, members, tasks]);

  const hasContextProject =
    !workspaceLoading &&
    workspaceProject != null &&
    workspaceProject.id != null &&
    workspaceProject.id !== "";
  const savedWorkLoading = milestonesLoading || tasksLoading;
  const loadError =
    workspaceError || membersError || milestonesError || tasksError || loaded.error;

  const retryLoad = () => {
    setAttempt((count) => count + 1);
    if (workspaceError) retryWorkspace();
    if (membersError) retryWorkspace();
    if (milestonesError) retryMilestones();
    if (tasksError) retryTasks();
  };
  const isLoading =
    loaded.key !== requestKey ||
    (!workspaceError && !hasContextProject) ||
    membersLoading ||
    savedWorkLoading;
  const data = isLoading ? null : loaded.data;

 const viewContribution = useCallback(
  (memberName) => {
    const base = `/projects/${projectId}/workspace/contributions`;
    if (!memberName || memberName === currentUser.name) {
      navigate(`${base}${search}`);
    } else {
      navigate(`${base}/review/${memberName.toLowerCase()}${search}`);
    }
  },
  [navigate, projectId, search, currentUser.name],
);

  async function handleSave({ deliverable }) {
    setSaveStatus("saving");
    setSavedNote("");
    try {
      const saved = await saveEvidenceDeliverable(projectId, deliverable);
      setLoaded((current) => ({
        ...current,
        data: {
          ...current.data,
          deliverables: [saved, ...(current.data?.deliverables ?? [])],
        },
      }));
      setEvidenceVersion((version) => version + 1);
      setDirty(false);
      setSaveStatus("idle");
      setSavedNote("Deliverable saved.");
    } catch (error) {
      console.error("Failed to save deliverable:", error);
      setSaveStatus("error");
    }
  }

  async function handleComplete() {
    setCompleteError("");
    setCompleteChecks([]);
    setCompleteStatus("completing");
    try {
      await completeProject(projectId, outcome);
      retryWorkspace();
      setResult({ visibility: VISIBILITY, audience: AUDIENCE });
      setCompleteStatus("idle");
    } catch (error) {
      console.error("Failed to complete project:", error);
      setCompleteError(completionErrorMessage(error));
      setCompleteChecks(
        error?.status === 409 && Array.isArray(error.checks)
          ? error.checks
          : [],
      );
      setCompleteStatus("idle");
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

  const { confirmations, deliverables } = data;
  const project = workspaceProject ?? {};
  const savedWork = { milestones: buildSavedWork(milestones, tasks) };
  const evidence = {
    outcome,
    deliverable: Array.isArray(deliverables) ? (deliverables[0] ?? null) : null,
  };
  const readiness = getReadiness(evidence, confirmations);
  const isCompleted = project.status === "Completed" || Boolean(result);
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
            <Button variant="secondary" fullWidth onClick={() => viewContribution()}>
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

      {completeError && (
        <div className={styles.banner}>
          <Alert variant="error" title="Project did not complete">
            {completeError}
            {completeChecks.length > 0 && (
              <ul className={styles.checkList}>
                {completeChecks.map((check, index) => (
                  <li key={`${index}-${check}`}>{check}</li>
                ))}
              </ul>
            )}
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
              outcome={outcome}
              status={saveStatus}
              locked={completeStatus === "completing"}
              onOutcomeChange={setOutcome}
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
