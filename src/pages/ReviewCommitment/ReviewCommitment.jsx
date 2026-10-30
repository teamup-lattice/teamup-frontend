import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import MilestonesCard from "../../components/collab/MilestonesCard";
import RoleContributionCard from "../../components/collab/RoleContributionCard";
import TeamAgreementsCard from "../../components/collab/TeamAgreementsCard";
import { invitation, joinRequest, people, project, roles, teamAgreements } from "../../data/collaborationData";
import { formatDate } from "../CreateProject/formatDate";
import styles from "./ReviewCommitment.module.css";

const supportedStates = ["unchecked", "saving", "error", "accepted"];
const supportedVariants = ["invitation", "request"];

function ReviewCommitment() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedState = searchParams.get("state");
  const requestedVariant = searchParams.get("variant");
  const state = supportedStates.includes(requestedState)
    ? requestedState
    : "unchecked";
  const variant = supportedVariants.includes(requestedVariant)
    ? requestedVariant
    : "invitation";
  const isInvitation = variant === "invitation";
  const participant = isInvitation ? people[invitation.to] : people[joinRequest.from];
  const role = roles[isInvitation ? invitation.roleKey : joinRequest.roleKey];
  const [isAccepted, setIsAccepted] = useState(false);
  const isLocked = state === "saving";
  const isChecked = isLocked || state === "error" || isAccepted;

  const setPreviewState = (nextState) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("state", nextState);
    setSearchParams(nextParams);
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
          <Button fullWidth onClick={() => navigate(`/projects/${invitationId}/workspace`)}>
            Open workspace
          </Button>
        </section>
      </main>
    );
  }

  const title =
    state === "saving" || state === "error"
      ? "Review your commitment"
      : "Review your commitment";
  const subtitle = isInvitation
    ? `${project.name} · ${participant.name} / Invitation from Ada`
    : `${project.name} · ${participant.name} / Approved request`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>{title}</h1>
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
              onClick={() => setPreviewState("saving")}
            >
              Accept and join team
            </Button>
            {state === "error" && (
              <Button variant="secondary" fullWidth onClick={() => setPreviewState("saving")}>
                Recheck current project and terms
              </Button>
            )}
            {isInvitation ? (
              <div className={styles.dangerButton}>
                <Button
                  fullWidth
                  disabled={isLocked}
                  onClick={() => navigate(`/invitations/${invitationId}?state=declinefailed`)}
                >
                  Decline invitation
                </Button>
              </div>
            ) : (
              <AltLink to={`/role-requests/${invitationId}`}>
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
    </main>
  );
}

export default ReviewCommitment;
