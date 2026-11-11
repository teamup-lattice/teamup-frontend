import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AvatarRow from "../../components/AvatarRow";
import Button from "../../components/Button";
import {
  approveJoinRequest,
  declineJoinRequest,
  getJoinRequest,
  getJoinRequestStatusLabel,
} from "../../services/joinRequestsService";
import styles from "./RoleRequest.module.css";

function requestErrorMessage(error) {
  if (error.status === 403) {
    return "Only the project owner or a manager can review join requests";
  }
  if (error.status === 404) return "We couldn't find that request.";
  if (error.status === 409) {
    return error.message && error.message !== "Something went wrong"
      ? error.message
      : "This request has already been answered, or the role is full or closed.";
  }
  return "Something went wrong. Try again.";
}

function displayValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(" · ");
  return typeof value === "string" ? value.trim() : "";
}

function Detail({ label, value }) {
  const text = displayValue(value);
  if (!text) return null;

  return (
    <div>
      <h3 className={styles.label}>{label}</h3>
      <p className={styles.body}>{text}</p>
    </div>
  );
}

function RoleRequestContent({ requestId, projectId }) {
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [decisionStatus, setDecisionStatus] = useState("");

  useEffect(() => {
    if (!projectId) return undefined;
    let isCurrent = true;

    getJoinRequest(projectId, requestId)
      .then((result) => {
        if (isCurrent) setRequest(result);
      })
      .catch((error) => {
        console.error("Failed to load join request:", error);
        if (isCurrent) setLoadError(requestErrorMessage(error));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, requestId, retryCount]);

  const retryLoad = () => {
    setLoadError("");
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  };

  const decide = async (decision) => {
    if (!request || isSubmitting) return;
    setIsSubmitting(true);
    setActionError("");
    setDecisionStatus("");
    try {
      if (decision === "ACCEPTED") {
        await approveJoinRequest(projectId, requestId);
      } else {
        await declineJoinRequest(projectId, requestId);
      }

      setRequest((current) => ({
        ...current,
        status: decision,
        statusLabel: getJoinRequestStatusLabel(decision),
      }));
      setDecisionStatus(decision);
    } catch (error) {
      setActionError(requestErrorMessage(error));
      if (error.status === 409) {
        try {
          setRequest(await getJoinRequest(projectId, requestId));
        } catch (reloadError) {
          console.error("Failed to refresh join request after a conflict:", reloadError);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!projectId) {
    return (
      <main className={styles.page}>
        <Alert variant="error">
          We couldn't open this request because the project is missing.
        </Alert>
        <Button fullWidth onClick={() => navigate("/projects")}>
          Back to My Projects
        </Button>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p role="status">Loading request…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className={styles.page}>
        <Alert variant="error" title="Couldn't load this request">
          {loadError}
        </Alert>
        <Button fullWidth onClick={retryLoad}>
          Retry
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate(`/projects/${projectId}/join-requests`)}
        >
          Back to join requests
        </Button>
      </main>
    );
  }

  if (!request) return null;

  const { project, role, requester } = request;
  const isPending = request.status === "PENDING";
  const isApproved = request.status === "ACCEPTED";
  const isDeclined = request.status === "DECLINED";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Review join request</h1>
        <p className={styles.subtitle}>
          {requester.name}
          {requester.headline && ` · ${requester.headline}`}
          {role.title && ` · ${role.title}`}
        </p>
      </header>

      {actionError && (
        <Alert variant="error" title="Decision could not save">
          {actionError}
        </Alert>
      )}
      {isSubmitting && (
        <Alert variant="info" title="Saving Owner decision…">
          The requester has no access while this saves. Do not submit another
          decision.
        </Alert>
      )}
      {decisionStatus && (
        <Alert
          variant="success"
          title={
            decisionStatus === "ACCEPTED"
              ? "Request approved"
              : "Request declined"
          }
        >
          {decisionStatus === "ACCEPTED"
            ? "Awaiting commitment. The requester must review and save acceptance to join."
            : "Your decision is saved. The requester has not joined and cannot access the workspace."}
        </Alert>
      )}
      {!isPending && !decisionStatus && (
        <Alert
          variant={isApproved ? "success" : "info"}
          title={`Request ${request.statusLabel.toLowerCase()}`}
        >
          {isApproved
            ? "Approved — not joined. The requester must review and save commitment acceptance to join."
            : isDeclined
              ? "Request declined. The requester has not joined."
              : `This request is ${request.statusLabel.toLowerCase()}.`}
        </Alert>
      )}

      <div className={styles.cards}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Applicant</h2>
          <AvatarRow
            initial={requester.name.charAt(0)}
            text={[requester.name, requester.headline].filter(Boolean).join(" · ")}
          />
          <Detail label="Bio" value={requester.bio} />
          <Detail label="Goals" value={requester.goals} />
          {requester.isAvailable != null && (
            <Detail
              label="Availability status"
              value={requester.isAvailable ? "Available" : "Not currently available"}
            />
          )}
          <Detail label="Weekly availability" value={requester.availability} />
          <Detail label="Preferred duration" value={requester.preferredDuration} />
          {requester.skills.length > 0 && (
            <Detail label="Skills" value={requester.skills} />
          )}
          <Detail label="Request status" value={request.statusLabel} />
          <Detail label="Received" value={request.createdAt} />
          <Detail label="Reviewed" value={request.reviewedAt} />
          <Detail label="Message" value={request.message} />
          {request.proposedHoursPerWeek != null && (
            <Detail
              label="Proposed hours per week"
              value={`${request.proposedHoursPerWeek} h / week`}
            />
          )}
          <Detail
            label="Planned task deadlines"
            value={request.plannedTaskDeadlines}
          />
          <Detail label="Decision note" value={request.decisionNote} />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Role</h2>
          <Detail label="Title" value={role.title} />
          <Detail label="Description" value={role.description} />
          {role.hoursPerWeek != null && (
            <Detail
              label="Hours per week"
              value={`${role.hoursPerWeek} h / week`}
            />
          )}
          {role.requiredMembers != null && (
            <Detail label="Required members" value={String(role.requiredMembers)} />
          )}
          <Detail label="Status" value={role.statusLabel} />
          {role.skills.length > 0 && (
            <Detail label="Required skills" value={role.skills} />
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Project</h2>
          <Detail label="Title" value={project.title} />
          <Detail label="Type" value={project.type} />
          <Detail label="Status" value={project.statusLabel} />
          <Detail label="Owner" value={project.owner.name} />
          <Detail label="Problem" value={project.problem} />
          <Detail label="Description" value={project.description} />
          <Detail label="Expected outcome" value={project.outcome} />
          {project.durationWeeks != null && (
            <Detail
              label="Duration"
              value={`${project.durationWeeks} ${
                project.durationWeeks === 1 ? "week" : "weeks"
              }`}
            />
          )}
          {project.weeklyHours != null && (
            <Detail
              label="Weekly hours"
              value={`${project.weeklyHours} h / week`}
            />
          )}
          <Detail label="Start date" value={project.startDate} />
          <Detail label="Target end date" value={project.targetEndDate} />
          <Detail
            label="Availability expectation"
            value={project.availabilityExpectation}
          />
          <Detail
            label="Response expectation"
            value={project.availabilityResponseExpectation}
          />
          {project.skills.length > 0 && (
            <Detail label="Project skills" value={project.skills} />
          )}
          {project.milestones.length > 0 && (
            <div>
              <h3 className={styles.label}>Milestones</h3>
              <ul className={styles.milestones}>
                {project.milestones.map((milestone) => (
                  <li key={milestone.id}>
                    {[milestone.name, milestone.date, milestone.status]
                      .filter(Boolean)
                      .join(" · ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {isPending && (
        <section className={styles.status}>
          <h2 className={styles.cardTitle}>Owner decision</h2>
          <p className={styles.body}>
            Approval does not add the requester to the team. They must confirm
            later.
          </p>
          <Button
            fullWidth
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Saving decision…"
            onClick={() => decide("ACCEPTED")}
          >
            Approve request
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={isSubmitting}
            onClick={() => decide("DECLINED")}
          >
            Decline request
          </Button>
        </section>
      )}

      <Button
        variant="secondary"
        fullWidth
        onClick={() => navigate(`/projects/${projectId}/join-requests`)}
      >
        Back to join requests
      </Button>
    </main>
  );
}

function RoleRequest() {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  return (
    <RoleRequestContent
      key={`${projectId ?? ""}:${requestId}`}
      requestId={requestId}
      projectId={projectId}
    />
  );
}

export default RoleRequest;
