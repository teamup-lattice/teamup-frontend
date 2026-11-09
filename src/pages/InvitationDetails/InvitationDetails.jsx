import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AvatarRow from "../../components/AvatarRow";
import Button from "../../components/Button";
import { declineInvitation, getInvitationById } from "../../services/invitationsService";
import styles from "./InvitationDetails.module.css";

const NOT_PENDING_MESSAGE =
  "This invitation is no longer pending. It may already have been answered, or it has expired.";

function InvitationDetails() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const declinedSuccessfully =
    new URLSearchParams(location.search).get("state") === "declined";
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadState, setLoadState] = useState({
    status: "loading",
    invitation: null,
    error: null,
  });
  const [actionState, setActionState] = useState({
    status: "idle",
    error: "",
  });
  const actionInFlight = useRef(false);

  useEffect(() => {
    if (declinedSuccessfully) return undefined;
    let isMounted = true;

    getInvitationById(invitationId)
      .then((invitation) => {
        if (!isMounted) return;
        setLoadState({
          status: invitation ? "ready" : "missing",
          invitation,
          error: null,
        });
      })
      .catch((error) => {
        if (isMounted) {
          setLoadState({ status: "error", invitation: null, error });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [declinedSuccessfully, invitationId, loadAttempt]);

  const sendDecline = useCallback(async () => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActionState({ status: "saving", error: "" });

    try {
      await declineInvitation(invitationId);
      setActionState({ status: "declined", error: "" });
    } catch (error) {
      if (error.status === 409 || error.status === 410) {
        setLoadState((current) => ({ ...current, status: "missing" }));
      } else {
        const message =
          error.status === 404
            ? "We couldn't find this invitation."
            : "Something went wrong. Try again.";
        setActionState({ status: "error", error: message });
      }
    } finally {
      actionInFlight.current = false;
    }
  }, [invitationId]);

  if (declinedSuccessfully) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Invitation declined</h1>
        </header>
        <Alert variant="success" title="Invitation declined">
          Your decision is saved. No membership was created; choose another
          Open project.
        </Alert>
        <Button fullWidth onClick={() => navigate("/discover")}>
          Discover Projects
        </Button>
      </main>
    );
  }

  if (loadState.status === "loading") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Invitation details</h1>
        <p role="status">Loading invitation…</p>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Invitation details</h1>
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
        <h1 className={styles.heading}>Invitation details</h1>
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

  if (actionState.status === "declined") {
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
            initial={invitation.inviterName.charAt(0)}
            text={`${invitation.inviterName} · ${role.title} · ${role.hours} h / week · ${role.weeks} weeks`}
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
        <p className={styles.subtitle}>{project.name}</p>
      </header>

      <Alert
        variant="info"
        title={`${invitation.inviterName} invited you to collaborate`}
      >
        Received {invitation.receivedOn} · {role.title}. Review the whole
        project and commitment before deciding.
      </Alert>

      <div className={styles.cards}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>{project.name}</h2>
          <p className={styles.mutedLine}>
            {[project.type, project.status].filter(Boolean).join(" · ")}
          </p>
          {project.problem && (
            <div>
              <h3 className={styles.label}>Problem</h3>
              <p className={styles.body}>{project.problem}</p>
            </div>
          )}
          {project.description && (
            <div>
              <h3 className={styles.label}>Description</h3>
              <p className={styles.body}>{project.description}</p>
            </div>
          )}
          {project.expectedOutcome && (
            <div>
              <h3 className={styles.label}>Expected outcome</h3>
              <p className={styles.body}>{project.expectedOutcome}</p>
            </div>
          )}
          {project.skills.length > 0 && (
            <div>
              <h3 className={styles.label}>Project skills</h3>
              <p className={styles.body}>{project.skills.join(" · ")}</p>
            </div>
          )}
          {project.ownerName && (
            <AvatarRow
              initial={project.ownerName.charAt(0)}
              text={`${project.ownerName} · Owner`}
            />
          )}
          <p className={styles.mutedLine}>
            Contact details are only visible to accepted teammates.
          </p>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Your role and expected contribution</h2>
          <p className={styles.roleTitle}>{role.title}</p>
          {role.responsibilities && (
            <p className={styles.body}>{role.responsibilities}</p>
          )}
          {role.requiredSkills.length > 0 && (
            <div>
              <h3 className={styles.label}>Required skills</h3>
              <p className={styles.body}>
                {role.requiredSkills.join(" · ")}
              </p>
            </div>
          )}
          <p className={styles.commitment}>
            {role.hours} h / week · {role.weeks} weeks
          </p>
          {(project.startDate || project.endDate) && (
            <div className={styles.dates}>
              {project.startDate && (
                <p className={styles.body}>Start: {project.startDate}</p>
              )}
              {project.endDate && (
                <p className={styles.body}>End: {project.endDate}</p>
              )}
            </div>
          )}
          {project.availabilityExpectation && (
            <div>
              <h3 className={styles.label}>Availability expectations</h3>
              <p className={styles.body}>
                {project.availabilityExpectation}
              </p>
            </div>
          )}
          {invitation.message && (
            <div>
              <h3 className={styles.label}>Message from {invitation.inviterName}</h3>
              <p className={styles.body}>{invitation.message}</p>
            </div>
          )}
          {invitation.expiresOn && (
            <p className={styles.mutedLine}>
              Invitation expires {invitation.expiresOn}
            </p>
          )}
          {project.durationWeeks != null && (
            <p className={styles.mutedLine}>
              Project duration: {project.durationWeeks} weeks
            </p>
          )}
          {project.teamSize != null && (
            <p className={styles.mutedLine}>Team size: {project.teamSize}</p>
          )}
          {project.availabilityResponseExpectation && (
            <p className={styles.mutedLine}>
              Response expectation: {project.availabilityResponseExpectation}
            </p>
          )}
        </article>

        {project.milestones.length > 0 && (
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Planned milestones</h2>
            {project.milestones.map((milestone) => (
              <p className={styles.body} key={milestone.id}>
                {milestone.name}
                {milestone.date ? ` — ${milestone.date}` : ""}
              </p>
            ))}
          </article>
        )}

        <div className={styles.actions}>
          {actionState.status === "error" && (
            <>
              <Alert variant="error" title="Invitation decision could not save">
                {actionState.error}
              </Alert>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setActionState({ status: "idle", error: "" });
                  setLoadState({
                    status: "loading",
                    invitation: null,
                    error: null,
                  });
                  setLoadAttempt((attempt) => attempt + 1);
                }}
              >
                Recheck invitation status
              </Button>
            </>
          )}
          <Button
            fullWidth
            disabled={actionState.status === "saving"}
            onClick={() =>
              navigate(`/invitations/${invitation.id}/commitment`)
            }
          >
            Review commitment
          </Button>
          <div className={styles.dangerButton}>
            <Button
              fullWidth
              loading={actionState.status === "saving"}
              loadingText="Decline invitation"
              onClick={sendDecline}
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
