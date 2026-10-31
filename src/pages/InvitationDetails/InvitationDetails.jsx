import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AvatarRow from "../../components/AvatarRow";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import Skeleton from "../../components/Skeleton";
import MilestonesCard from "../../components/collab/MilestonesCard";
import ProjectSummaryCard from "../../components/collab/ProjectSummaryCard";
import RoleContributionCard from "../../components/collab/RoleContributionCard";
import TeamAgreementsCard from "../../components/collab/TeamAgreementsCard";
import { invitation, people, project, roles, teamAgreements } from "../../data/collaborationData";
import { formatDate } from "../CreateProject/formatDate";
import useSimulatedAction from "../../hooks/useSimulatedAction";
import styles from "./InvitationDetails.module.css";

const invitee = people[invitation.to];
const invitedRole = roles[invitation.roleKey];
const supportedStates = [
  "default",
  "empty",
  "loading",
  "saving",
  "declinefailed",
  "declined",
];

function InvitationDetails() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status: actionStatus, run } = useSimulatedAction();
  const requestedState = searchParams.get("state");
  const isFrozenPreview = supportedStates.includes(requestedState);
  const state = isFrozenPreview
    ? requestedState
    : actionStatus === "saving"
      ? "saving"
      : actionStatus === "failed"
        ? "declinefailed"
        : actionStatus === "done"
          ? "declined"
          : "default";

  const clearStateAndFailure = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("state");
    nextParams.delete("fail");
    setSearchParams(nextParams, { replace: true });
  };
  const retryDecline = () => {
    clearStateAndFailure();
    run({ ignoreFailure: true });
  };
  const declineInvitation = () => {
    if (!isFrozenPreview) {
      run();
    }
  };

  if (state === "empty") {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.cardTitle}>Invitation details</h1>
          <EmptyState
            title="No pending invitation available"
            text="No pending invitation. Check your Dashboard."
          >
            <Button fullWidth onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </EmptyState>
          <Button fullWidth disabled>
            Review commitment
          </Button>
        </section>
      </main>
    );
  }

  if (state === "loading") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>{project.name}</h1>
          <p className={styles.subtitle}>
            Checking current invitation and role terms…
          </p>
        </header>
        <div className={styles.skeletons}>
          <Skeleton />
          <Skeleton />
        </div>
        <div className={styles.loadingBar} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Loading invitation…
        </div>
        <Button fullWidth disabled>
          Review commitment
        </Button>
      </main>
    );
  }

  if (state === "declinefailed") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>David&apos;s invitation</h1>
          <p className={styles.subtitle}>
            {invitedRole.title} · {invitedRole.hours} h / week ·{" "}
            {invitedRole.weeks} weeks
          </p>
        </header>
        <Alert variant="error" title="Invitation decision could not save">
          The invitation remains pending. No membership was created; your
          project and role context are kept.
        </Alert>
        <div className={styles.actions}>
          <Button fullWidth onClick={retryDecline}>
            Recheck invitation status
          </Button>
          <div className={styles.dangerButton}>
            <Button fullWidth onClick={retryDecline}>
              Decline invitation
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (state === "declined") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>{project.name}</h1>
        </header>
        <Alert variant="success" title="Invitation declined">
          Your decision is saved. No membership was created; choose another
          Open project.
        </Alert>
        <section className={styles.statusCard}>
          <AvatarRow
            initial={invitee.name.charAt(0)}
            text={`${invitee.name} · ${invitedRole.title} · ${invitedRole.hours} h / week · ${invitedRole.weeks} weeks`}
          />
          <Button fullWidth onClick={() => navigate("/discover")}>
            Discover Projects
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Invitation details</h1>
        <p className={styles.subtitle}>
          {project.name} · {invitee.name} / Recipient
        </p>
      </header>
      <Alert variant="info" title="Ada invited you to collaborate">
        Received {formatDate(invitation.receivedOn)} · {invitedRole.title}.
        Review the whole project and commitment before deciding.
      </Alert>
      <div className={styles.cards}>
        <ProjectSummaryCard project={project} variant="full" />
        <RoleContributionCard role={invitedRole} project={project} />
        <MilestonesCard
          milestones={project.milestones}
          taskDeadlines={invitedRole.taskDeadlines}
        />
        <TeamAgreementsCard
          agreements={teamAgreements}
          variant="invitation"
        />
        <div className={styles.actions}>
          <Button
            fullWidth
            disabled={state === "saving"}
            onClick={() =>
              navigate(`/invitations/${invitationId}/commitment`)
            }
          >
            Review commitment
          </Button>
          <div className={styles.dangerButton}>
            <Button
              fullWidth
              loading={state === "saving"}
              loadingText="Decline invitation"
              onClick={declineInvitation}
            >
              Decline invitation
            </Button>
          </div>
          <p className={styles.helper}>
            Joining requires saved, dated acceptance.
          </p>
        </div>
      </div>
    </main>
  );
}

export default InvitationDetails;
