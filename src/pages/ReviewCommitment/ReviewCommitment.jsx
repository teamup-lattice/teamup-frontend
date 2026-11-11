import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import { formatDate } from "../CreateProject/formatDate";
import {
  acceptInvitation,
  declineInvitation,
  getInvitationById,
} from "../../services/invitationsService";
import {
  confirmJoinRequest,
  getJoinRequest,
  getJoinRequestStatusLabel,
  withdrawJoinRequest,
} from "../../services/joinRequestsService";
import styles from "./ReviewCommitment.module.css";

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
  const { invitationId: requestId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const [request, setRequest] = useState(null);
  const [loadState, setLoadState] = useState(
    projectId && requestId ? "loading" : "missing",
  );
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isAccepted, setIsAccepted] = useState(false);
  const [action, setAction] = useState({
    status: "idle",
    error: "",
    pendingAction: "",
  });
  const actionInFlight = useRef(false);

  useEffect(() => {
    if (!projectId || !requestId) return undefined;
    let isCurrent = true;

    getJoinRequest(projectId, requestId)
      .then((result) => {
        if (isCurrent) {
          setRequest(result);
          setLoadState("ready");
          setLoadError("");
        }
      })
      .catch((error) => {
        console.error("Failed to load requester join request:", error);
        if (isCurrent) {
          setLoadError(requestErrorMessage(error, "load"));
          setLoadState(error.status === 404 ? "not-found" : "error");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, requestId, retryCount]);

  const retryLoad = () => {
    setLoadError("");
    setLoadState("loading");
    setRetryCount((count) => count + 1);
  };

  const actOnRequest = async (actionName) => {
    if (!request || actionInFlight.current) return;

    actionInFlight.current = true;
    setAction({ status: "saving", error: "", pendingAction: actionName });

    try {
      if (actionName === "confirm") {
        await confirmJoinRequest(requestId);
        navigate(`/projects/${encodeURIComponent(projectId)}/workspace`);
        return;
      }

      await withdrawJoinRequest(requestId);
      setRequest((current) => ({
        ...current,
        status: "WITHDRAWN",
        statusLabel: getJoinRequestStatusLabel("WITHDRAWN"),
      }));
      setAction({ status: "success", error: "", pendingAction: "" });
    } catch (error) {
      setAction({
        status: "error",
        error: requestErrorMessage(error, actionName),
        pendingAction: actionName,
      });

      if (error.status === 409) {
        try {
          setRequest(await getJoinRequest(projectId, requestId));
        } catch (reloadError) {
          console.error(
            "Failed to refresh requester join request after a conflict:",
            reloadError,
          );
          setAction((current) => ({
            ...current,
            error: `${current.error} Current status could not be refreshed: ${requestErrorMessage(reloadError, "load")}`,
          }));
        }
      }
    } finally {
      actionInFlight.current = false;
    }
  };

  if (loadState === "loading") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <p role="status">Loading request…</p>
      </main>
    );
  }

  if (loadState === "missing" || loadState === "not-found") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <Alert variant="info" title="Request not found">
          {loadError ||
            "We couldn't open this request because its project information is missing."}
        </Alert>
        <Button fullWidth onClick={() => navigate("/discover")}>
          Back to discovery
        </Button>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <Alert variant="error" title="Couldn't load this request">
          {loadError}
        </Alert>
        <Button fullWidth onClick={retryLoad}>
          Retry
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate("/discover")}>
          Back to discovery
        </Button>
      </main>
    );
  }

  const project = request.project;
  const role = request.role;
  const isPending = request.status === "PENDING";
  const isAcceptedStatus = request.status === "ACCEPTED";
  const canWithdraw = isPending || isAcceptedStatus;
  const isLocked = action.status === "saving";
  const statusLabel =
    request.statusLabel || getJoinRequestStatusLabel(request.status);
  const statusMessage = {
    PENDING: "Your request is waiting for the project owner's decision.",
    ACCEPTED:
      "Your request is approved, but you have not joined yet. Confirm to create your membership.",
    DECLINED: "The project owner declined your request.",
    WITHDRAWN: "You withdrew this request.",
  }[request.status] || `Your request is ${statusLabel.toLowerCase()}.`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Review your commitment</h1>
        <p className={styles.subtitle}>
          {project.name} · {role.title}
        </p>
      </header>

      <Alert
        variant={request.status === "ACCEPTED" ? "success" : "info"}
        title={`Request ${statusLabel.toLowerCase()}`}
      >
        {statusMessage}
      </Alert>
      {isLocked && (
        <Alert variant="info" title="Saving request action…">
          Please wait while your request is updated.
        </Alert>
      )}
      {action.status === "success" && (
        <Alert variant="success" title="Request withdrawn">
          Your request has been withdrawn.
        </Alert>
      )}
      {action.status === "error" && (
        <Alert variant="error" title="Request action could not be completed">
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
              {[project.ownerName && `Owner: ${project.ownerName}`, project.type, project.statusLabel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </article>
          <article className={styles.outcomeCard}>
            <h2 className={styles.cardTitle}>Your role and requirements</h2>
            {role.responsibilities && (
              <p className={styles.body}>{role.responsibilities}</p>
            )}
            {role.requiredSkills.length > 0 && (
              <p className={styles.body}>
                Required skills: {role.requiredSkills.join(" · ")}
              </p>
            )}
            <p className={styles.body}>
              {[role.hours != null && `${role.hours} h / week`, role.weeks != null && `${role.weeks} weeks`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {(project.startDate || project.endDate) && (
              <p className={styles.body}>
                {project.startDate ? `Start: ${project.startDate}` : ""}
                {project.startDate && project.endDate ? " · " : ""}
                {project.endDate ? `End: ${project.endDate}` : ""}
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
          {(request.message ||
            request.proposedHoursPerWeek != null ||
            request.plannedTaskDeadlines) && (
            <article className={styles.outcomeCard}>
              <h2 className={styles.cardTitle}>Your request</h2>
              {request.message && (
                <p className={styles.body}>Message: {request.message}</p>
              )}
              {request.proposedHoursPerWeek != null && (
                <p className={styles.body}>
                  Proposed hours per week: {request.proposedHoursPerWeek}
                </p>
              )}
              {request.plannedTaskDeadlines && (
                <p className={styles.body}>
                  Planned task deadlines: {request.plannedTaskDeadlines}
                </p>
              )}
            </article>
          )}
        </section>

        <section className={styles.actions}>
          <article className={styles.acceptanceCard}>
            <h2 className={styles.cardTitle}>Request status</h2>
            <p className={styles.emphasis}>{statusLabel}</p>
            {isAcceptedStatus && (
              <>
                <Checkbox
                  label="I accept this commitment summary."
                  checked={isAccepted}
                  disabled={isLocked}
                  onChange={(event) => setIsAccepted(event.target.checked)}
                />
                {isLocked && (
                  <div className={styles.loadingBar} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    Confirming commitment…
                  </div>
                )}
                <Button
                  fullWidth
                  disabled={!isAccepted || isLocked}
                  loading={isLocked && action.pendingAction === "confirm"}
                  loadingText="Confirming commitment…"
                  onClick={() => actOnRequest("confirm")}
                >
                  Confirm commitment
                </Button>
              </>
            )}
            {isPending && (
              <p className={styles.helper}>
                You can withdraw while the project owner is reviewing your request.
              </p>
            )}
            {canWithdraw && (
              <div className={styles.dangerButton}>
                <Button
                  fullWidth
                  disabled={isLocked}
                  loading={isLocked && action.pendingAction === "withdraw"}
                  loadingText="Withdrawing request…"
                  onClick={() => actOnRequest("withdraw")}
                >
                  Withdraw / back out
                </Button>
              </div>
            )}
            <AltLink to={`/projects/${encodeURIComponent(projectId)}`}>
              Back to project
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

function requestErrorMessage(error, actionName) {
  const serverMessage =
    error?.message && error.message !== "Something went wrong"
      ? error.message
      : "";

  if (error?.status === 404) {
    return serverMessage || "We couldn't find this request or project.";
  }
  if (error?.status === 409) {
    return (
      serverMessage ||
      (actionName === "confirm"
        ? "This request is not approved yet, the role may be full, or you may already be a member."
        : "This request can no longer be withdrawn in its current state.")
    );
  }

  return serverMessage || "Something went wrong. Try again.";
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
