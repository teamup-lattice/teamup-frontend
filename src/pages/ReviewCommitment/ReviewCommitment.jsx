import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import MilestonesCard from "../../components/collab/MilestonesCard";
import RoleContributionCard from "../../components/collab/RoleContributionCard";
import TeamAgreementsCard from "../../components/collab/TeamAgreementsCard";
import {
  invitation,
  invitationId,
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
import styles from "./ReviewCommitment.module.css";

const supportedStates = ["unchecked", "saving", "error", "accepted"];
const supportedVariants = ["invitation", "request"];

function ReviewCommitment() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status: actionStatus, run } = useSimulatedAction();
  const requestedState = searchParams.get("state");
  const requestedVariant = searchParams.get("variant");
  const isFrozenPreview = supportedStates.includes(requestedState);
  const variant = supportedVariants.includes(requestedVariant)
    ? requestedVariant
    : "invitation";
  const isInvitation = variant === "invitation";
  const participant = isInvitation ? people[invitation.to] : people[joinRequest.from];
  const role = roles[isInvitation ? invitation.roleKey : joinRequest.roleKey];
  const [isAccepted, setIsAccepted] = useState(false);
  const [pendingAction, setPendingAction] = useState("accept");
  const state = isFrozenPreview
    ? requestedState
    : actionStatus === "saving"
      ? "saving"
      : actionStatus === "failed"
        ? "error"
        : actionStatus === "done"
          ? pendingAction === "decline"
            ? "saving"
            : "accepted"
          : "unchecked";
  const isLocked = state === "saving";
  const isChecked = isLocked || state === "error" || isAccepted;

  useEffect(() => {
    if (
      !isFrozenPreview &&
      actionStatus === "done" &&
      pendingAction === "decline"
    ) {
      navigate(`/invitations/${invitationId}?state=declined`, {
        replace: true,
      });
    }
  }, [actionStatus, isFrozenPreview, navigate, pendingAction]);

  const clearStateAndFailure = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("state");
    nextParams.delete("fail");
    setSearchParams(nextParams, { replace: true });
  };
  const startAcceptance = () => {
    if (isChecked && !isFrozenPreview) {
      setPendingAction("accept");
      run();
    }
  };
  const retryAcceptance = () => {
    setIsAccepted(true);
    setPendingAction("accept");
    clearStateAndFailure();
    run({ ignoreFailure: true });
  };
  const declineInvitation = () => {
    if (!isFrozenPreview) {
      setPendingAction("decline");
      run();
    }
  };

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
            Accepted {formatDate(project.startDate)} · 09:40
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
          <AltLink to="/discover">Discover Projects</AltLink>
        </section>
      </main>
    );
  }

  const subtitle = isInvitation
    ? `${project.name} · ${participant.name} / Invitation from Ada`
    : `${project.name} · ${participant.name} / Approved request`;

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
            {isInvitation ? (
              <div className={styles.dangerButton}>
                <Button
                  fullWidth
                  disabled={isLocked}
                  loading={pendingAction === "decline" && isLocked}
                  loadingText="Decline invitation"
                  onClick={declineInvitation}
                >
                  Decline invitation
                </Button>
              </div>
            ) : (
              <AltLink to={`/role-requests/${requestId}`}>
                Back to request
              </AltLink>
            )}
          </article>
          <article className={styles.privacyCard}>
            <h2 className={styles.cardTitle}>Access and privacy</h2>
            <p className={styles.helper}>
              Only teammates can see your contact details.
            </p>
          </article>
        </section>
      </div>
      <AltLink to="/discover">Discover Projects</AltLink>
    </main>
  );
}

export default ReviewCommitment;
