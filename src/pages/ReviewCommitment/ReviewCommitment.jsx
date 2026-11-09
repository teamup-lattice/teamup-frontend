import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import MilestonesCard from "../../components/collab/MilestonesCard";
import RoleContributionCard from "../../components/collab/RoleContributionCard";
import TeamAgreementsCard from "../../components/collab/TeamAgreementsCard";
import {
  joinRequest,
  people,
  project,
  projectId,
  requestId,
  roles,
  teamAgreements,
} from "../../data/collaborationData";
import { formatDate } from "../CreateProject/formatDate";
import useSimulatedAction from "../../hooks/useSimulatedAction";
import {
  acceptInvitation,
  declineInvitation,
  getInvitationById,
} from "../../services/invitationsService";
import styles from "./ReviewCommitment.module.css";

const supportedStates = ["unchecked", "saving", "error", "accepted"];

const NOT_PENDING_MESSAGE =
  "This invitation is no longer pending. It may already have been answered, or it has expired.";

function InvitationCommitment() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadState, setLoadState] = useState({
    status: "loading",
    invitation: null,
    error: null,
  });
  const [accepted, setAccepted] = useState(false);
  const [action, setAction] = useState({
    status: "idle",
    error: "",
    pendingAction: "",
  });
  const [acceptedAt, setAcceptedAt] = useState(null);
  const actionInFlight = useRef(false);

  useEffect(() => {
    let isMounted = true;
    getInvitationById(invitationId)
      .then((invitation) => {
        if (isMounted) {
          setLoadState({
            status: invitation ? "ready" : "missing",
            invitation,
            error: null,
          });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadState({ status: "error", invitation: null, error });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [invitationId, loadAttempt]);

  const respond = async (responseAction) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setAction({
      status: "saving",
      error: "",
      pendingAction: responseAction,
    });
    try {
      if (responseAction === "accept") {
        await acceptInvitation(invitationId);
        setAcceptedAt(new Date());
        setAction({ status: "accepted", error: "", pendingAction: "" });
      } else {
        await declineInvitation(invitationId);
        navigate(`/invitations/${invitationId}?state=declined`, {
          replace: true,
        });
      }
    } catch (error) {
      if (error.status === 409 || error.status === 410) {
        setLoadState((current) => ({ ...current, status: "missing" }));
      } else {
        const message =
          error.status === 404
            ? "We couldn't find this invitation."
            : "Something went wrong. Try again.";
        setAction({
          status: "error",
          error: message,
          pendingAction: responseAction,
        });
      }
    } finally {
      actionInFlight.current = false;
    }
  };

  if (loadState.status === "loading") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <p role="status">Loading invitation…</p>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <Alert variant="error" title="Invitation could not load">
          Something went wrong. Try again.
        </Alert>
        <Button
          onClick={() => {
            setLoadState({ status: "loading", invitation: null, error: null });
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          Retry
        </Button>
      </main>
    );
  }

  if (loadState.status === "missing") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <Alert variant="info" title="Invitation is no longer pending">
          {NOT_PENDING_MESSAGE}
        </Alert>
        <Button fullWidth onClick={() => navigate("/dashboard")}>
          Dashboard
        </Button>
      </main>
    );
  }

  const { invitation } = loadState;
  const { project, role } = invitation;
  const isLocked = action.status === "saving";
  const acceptedDate = acceptedAt
    ? formatDate(
        `${acceptedAt.getFullYear()}-${String(
          acceptedAt.getMonth() + 1,
        ).padStart(2, "0")}-${String(acceptedAt.getDate()).padStart(2, "0")}`,
      )
    : "";
  const acceptedTime = acceptedAt
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(acceptedAt)
    : "";

  if (action.status === "accepted") {
    return (
      <main className={styles.page}>
        <section className={styles.recordCard}>
          <div className={styles.recordHeading}>
            <h1 className={styles.cardTitle}>
              {project.name} · {invitation.inviterName}
            </h1>
            <p className={styles.body}>
              {[
                role.title,
                role.hours != null ? `${role.hours} h / week` : "",
                role.weeks != null ? `${role.weeks} weeks` : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <Alert variant="success" title="Dated commitment saved">
            You joined {project.name}. Your explicit acceptance and membership
            are confirmed.
          </Alert>
          <p className={styles.emphasis}>
            Accepted {acceptedDate} · {acceptedTime}
          </p>
          <p className={styles.body}>
            Accepted by you · {role.title}
          </p>
          <p className={styles.helper}>
            Joined. Other roles may remain open; the project has not
            necessarily started.
          </p>
          <Button
            fullWidth
            onClick={() => navigate(`/projects/${project.id}/workspace`)}
          >
            Open workspace
          </Button>
        </section>
      </main>
    );
  }

  const formattedRole =
    [
      role.title,
      role.hours != null ? `${role.hours} h / week` : "",
      role.weeks != null ? `${role.weeks} weeks` : "",
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <p className={styles.subtitle}>
          {project.name} · Invitation from {invitation.inviterName}
        </p>
      </header>

      {action.status === "idle" && (
        <Alert variant="info" title="Review before joining">
          Membership begins only after your acceptance is saved.
        </Alert>
      )}
      {isLocked && (
        <Alert variant="info" title="Saving dated acceptance…">
          Saving acceptance. Not joined; workspace locked. Save temporarily
          disabled.
        </Alert>
      )}
      {action.status === "error" && (
        <Alert
          variant="error"
          title={
            action.pendingAction === "decline"
              ? "Invitation decision could not save"
              : "Acceptance could not save"
          }
        >
          {action.error}
        </Alert>
      )}

      <div className={styles.columns}>
        <section className={styles.details}>
          <article className={styles.outcomeCard}>
            <h2 className={styles.cardTitle}>The shared outcome</h2>
            {project.expectedOutcome && (
              <p className={styles.body}>{project.expectedOutcome}</p>
            )}
            <p className={styles.helper}>
              {project.ownerName && `Owner: ${project.ownerName} · `}
              {[project.type, project.status].filter(Boolean).join(" · ")}
            </p>
          </article>
          <article className={styles.outcomeCard}>
            <h2 className={styles.cardTitle}>
              Your role and expected contribution
            </h2>
            <p className={styles.emphasis}>{role.title}</p>
            {role.responsibilities && (
              <p className={styles.body}>{role.responsibilities}</p>
            )}
            {role.requiredSkills.length > 0 && (
              <p className={styles.body}>
                Required skills: {role.requiredSkills.join(" · ")}
              </p>
            )}
            <p className={styles.body}>{formattedRole}</p>
            {project.durationWeeks != null && (
              <p className={styles.body}>
                Project duration: {project.durationWeeks} weeks
              </p>
            )}
            {(project.startDate || project.endDate) && (
              <p className={styles.body}>
                {project.startDate ? `Start: ${project.startDate}` : ""}
                {project.startDate && project.endDate ? " · " : ""}
                {project.endDate ? `End: ${project.endDate}` : ""}
              </p>
            )}
            {project.availabilityExpectation && (
              <p className={styles.body}>
                Availability expectations: {project.availabilityExpectation}
              </p>
            )}
            {project.availabilityResponseExpectation && (
              <p className={styles.body}>
                Response expectation: {project.availabilityResponseExpectation}
              </p>
            )}
            {project.teamSize != null && (
              <p className={styles.body}>Team size: {project.teamSize}</p>
            )}
            {invitation.message && (
              <p className={styles.body}>
                Message from {invitation.inviterName}: {invitation.message}
              </p>
            )}
          </article>
          {project.milestones.length > 0 && (
            <article className={styles.outcomeCard}>
              <h2 className={styles.cardTitle}>Planned milestones</h2>
              {project.milestones.map((milestone) => (
                <p className={styles.body} key={milestone.id}>
                  {milestone.name}
                  {milestone.date ? ` — ${milestone.date}` : ""}
                </p>
              ))}
            </article>
          )}
        </section>

        <section className={styles.actions}>
          <article className={styles.acceptanceCard}>
            <h2 className={styles.cardTitle}>Your explicit acceptance</h2>
            <Checkbox
              label="I accept this commitment summary."
              checked={
                accepted ||
                (isLocked && action.pendingAction === "accept") ||
                (action.status === "error" &&
                  action.pendingAction === "accept")
              }
              disabled={isLocked}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            {isLocked && (
              <>
                <p className={styles.helper}>
                  Temporarily locked while saving. No access yet.
                </p>
                <div className={styles.loadingBar} role="status">
                  <span className={styles.spinner} aria-hidden="true" />
                  Saving acceptance…
                </div>
              </>
            )}
            {action.status === "error" && (
              <p className={styles.helper}>
                Your choice is retained; no membership was created.
              </p>
            )}
            <Button
              fullWidth
              disabled={
                (!accepted &&
                  !(
                    action.status === "error" &&
                    action.pendingAction === "decline"
                  )) ||
                isLocked
              }
              onClick={() =>
                respond(
                  action.status === "error" &&
                    action.pendingAction === "decline"
                    ? "decline"
                    : "accept",
                )
              }
            >
              {action.status === "error" &&
              action.pendingAction === "decline"
                ? "Retry decline invitation"
                : "Accept and join team"}
            </Button>
            {action.status === "error" &&
              action.pendingAction !== "decline" && (
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={isLocked}
                  onClick={() => respond("accept")}
                >
                  Recheck current project and terms
                </Button>
              )}
            <div className={styles.dangerButton}>
              <Button
                fullWidth
                disabled={isLocked}
                loading={isLocked && action.pendingAction === "decline"}
                loadingText="Decline invitation"
                onClick={() => respond("decline")}
              >
                Decline invitation
              </Button>
            </div>
          </article>
          <article className={styles.privacyCard}>
            <h2 className={styles.cardTitle}>Access and privacy</h2>
            <p className={styles.helper}>
              Only teammates can see your contact details.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

function JoinRequestCommitment() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status: actionStatus, run } = useSimulatedAction();
  const requestedState = searchParams.get("state");
  const isFrozenPreview = supportedStates.includes(requestedState);
  const participant = people[joinRequest.from];
  const role = roles[joinRequest.roleKey];
  const [isAccepted, setIsAccepted] = useState(false);
  const [pendingAction, setPendingAction] = useState("accept");
  const [acceptedAt, setAcceptedAt] = useState(null);
  const state = isFrozenPreview
    ? requestedState
    : actionStatus === "saving"
      ? "saving"
      : actionStatus === "failed"
        ? "error"
        : actionStatus === "done"
          ? pendingAction === "decline"
            ? "saving"
            : acceptedAt
              ? "accepted"
              : "saving"
          : "unchecked";
  const isLocked = state === "saving";
  const isChecked = isLocked || state === "error" || isAccepted;

  useEffect(() => {
    if (!isFrozenPreview && actionStatus === "done") {
      const timer = window.setTimeout(() => {
        setAcceptedAt(new Date());
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [actionStatus, isFrozenPreview]);

  const clearStateAndFailure = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("state");
    nextParams.delete("fail");
    setSearchParams(nextParams, { replace: true });
  };
  const startAcceptance = () => {
    if (isChecked && !isFrozenPreview) {
      setAcceptedAt(null);
      setPendingAction("accept");
      run();
    }
  };
  const retryAcceptance = () => {
    setIsAccepted(true);
    setAcceptedAt(null);
    setPendingAction("accept");
    clearStateAndFailure();
    run({ ignoreFailure: true });
  };

  const acceptedDate = acceptedAt
    ? formatDate(
        `${acceptedAt.getFullYear()}-${String(
          acceptedAt.getMonth() + 1,
        ).padStart(2, "0")}-${String(acceptedAt.getDate()).padStart(2, "0")}`,
      )
    : "";
  const acceptedTime = acceptedAt
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(acceptedAt)
    : "";
  if (state === "accepted") {
    return (
      <main className={styles.page}>
        <section className={styles.recordCard}>
          <div className={styles.recordHeading}>
            <h1 className={styles.cardTitle}>
              {project.name} · {participant.name}
            </h1>
            <p className={styles.body}>
              {role.title} · {role.hours} h / week · {role.weeks} weeks
            </p>
          </div>
          <Alert variant="success" title="Dated commitment saved">
            You joined {project.name}. Your explicit acceptance and membership
            are confirmed.
          </Alert>
          <p className={styles.emphasis}>
            Accepted{" "}
            {isFrozenPreview
              ? "19 Oct 2026 · 09:40"
              : `${acceptedDate} · ${acceptedTime}`}
          </p>
          <p className={styles.body}>
            Accepted by {participant.name} · {role.title}
          </p>
          <p className={styles.helper}>
            Joined. Other roles may remain open; the project has not
            necessarily started.
          </p>
          <Button
            fullWidth
            onClick={() => navigate(`/projects/${projectId}/workspace`)}
          >
            Open workspace
          </Button>
        </section>
      </main>
    );
  }

  const subtitle = `${project.name} · ${participant.name} / Approved request`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {state === "unchecked" && (
        <Alert variant="info" title="Review before joining">
          Membership begins only after dated acceptance is saved.
        </Alert>
      )}
      {state === "saving" && (
        <Alert variant="info" title="Saving dated acceptance…">
          Saving acceptance. Not joined; workspace locked. Save temporarily
          disabled.
        </Alert>
      )}
      {state === "error" && (
        <Alert variant="error" title="Acceptance could not save">
          You have not joined. Your checkbox choice is retained; recheck current
          role terms and eligibility before retrying.
        </Alert>
      )}

      <div className={styles.columns}>
        <section className={styles.details}>
          <article className={styles.outcomeCard}>
            <h2 className={styles.cardTitle}>The shared outcome</h2>
            <p className={styles.body}>{project.expectedOutcome}</p>
            <p className={styles.helper}>
              Owner: {project.ownerName} / {project.ownerRole} · {project.type}
            </p>
          </article>
          <RoleContributionCard role={role} project={project} />
          <MilestonesCard
            milestones={project.milestones}
            taskDeadlines={role.taskDeadlines}
          />
          <TeamAgreementsCard
            agreements={teamAgreements}
            variant="commitment"
          />
        </section>

        <section className={styles.actions}>
          <article className={styles.acceptanceCard}>
            <h2 className={styles.cardTitle}>Your explicit acceptance</h2>
            <Checkbox
              label="I accept this commitment summary."
              checked={isChecked}
              disabled={isLocked}
              onChange={(event) => setIsAccepted(event.target.checked)}
            />
            {isLocked && (
              <>
                <p className={styles.helper}>
                  Temporarily locked while saving. No access yet.
                </p>
                <div className={styles.loadingBar} role="status">
                  <span className={styles.spinner} aria-hidden="true" />
                  Saving acceptance…
                </div>
              </>
            )}
            {state === "error" && (
              <p className={styles.helper}>
                Local choice retained · no membership created.
              </p>
            )}
            <Button
              fullWidth
              disabled={!isChecked || isLocked}
              onClick={state === "error" ? retryAcceptance : startAcceptance}
            >
              Accept and join team
            </Button>
            {state === "error" && (
              <Button variant="secondary" fullWidth onClick={retryAcceptance}>
                Recheck current project and terms
              </Button>
            )}
            <AltLink to={`/role-requests/${requestId}`}>
              Back to request
            </AltLink>
          </article>
          <article className={styles.privacyCard}>
            <h2 className={styles.cardTitle}>Access and privacy</h2>
            <p className={styles.helper}>
              Only teammates can see your contact details.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

function ReviewCommitment() {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant");
  return variant === "request" ? (
    <JoinRequestCommitment />
  ) : (
    <InvitationCommitment />
  );
}

export default ReviewCommitment;
