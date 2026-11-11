import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import ProjectSummaryCard from "../../components/collab/ProjectSummaryCard";
import Select from "../../components/Select";
import { getProjectById } from "../../services/projectService";
import { sendJoinRequest } from "../../services/joinRequestsService";
import styles from "./RequestRole.module.css";

function RequestRoleContent({ projectId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryRoleId = searchParams.get("role");
  const navigationRoleId = location.state?.roleId;
  const requestedRoleId = queryRoleId || navigationRoleId || "";

  const [project, setProject] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sentRequestId, setSentRequestId] = useState(null);
  const [hasSentRequest, setHasSentRequest] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    getProjectById(projectId)
      .then((response) => {
        if (!response?.project) {
          throw new Error("Project response is missing project data.");
        }
        if (isCurrent) setProject(response.project);
      })
      .catch((error) => {
        console.error("Failed to load project for role request:", error);
        if (isCurrent) setLoadError(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, retryCount]);

  if (!project && loadError) {
    return (
      <main className={styles.page}>
        <Alert variant="error" title="Couldn't load this project">
          Try again to load the project and its open roles.
        </Alert>
        <Button
          fullWidth
          onClick={() => {
            setLoadError(false);
            setRetryCount((count) => count + 1);
          }}
        >
          Retry
        </Button>
      </main>
    );
  }

  if (!project) {
    return (
      <main className={styles.page}>
        <p role="status">Loading…</p>
      </main>
    );
  }

  const roles = Array.isArray(project.roles) ? project.roles : [];
  const openRoles = roles.filter((role) => role.status === "OPEN");
  const roleId = requestedRoleId || selectedRoleId || openRoles[0]?.id || "";
  const selectedRole = roles.find(
    (role) => String(role.id) === String(roleId),
  );
  const projectDetailsPath = `/projects/${projectId}`;
  const projectSummary = {
    name: project.title ?? "",
    expectedOutcome: project.outcome ?? "",
    ownerName: project.owner?.name ?? "",
  };
  const requiredSkills = (Array.isArray(selectedRole?.skills)
    ? selectedRole.skills
    : []
  )
    .map((item) => item?.skill?.name)
    .filter(Boolean);
  const projectSkills = (Array.isArray(project.skills) ? project.skills : [])
    .map((item) => item?.skill?.name)
    .filter(Boolean);
  const roleHours =
    selectedRole.hoursPerWeek == null
      ? "Hours not specified"
      : `${selectedRole.hoursPerWeek} h / week`;

  const handleSubmit = async () => {
    if (!selectedRole || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await sendJoinRequest({
        projectId,
        roleId: String(selectedRole.id),
      });
      const requestId =
        response?.joinRequest?.id ?? response?.request?.id ?? response?.id;
      setSentRequestId(requestId ?? null);
      setHasSentRequest(true);
    } catch (error) {
      const messages = {
        400: error.message || "Something went wrong. Try again.",
        403: "You can't request a role on your own project.",
        404: "We couldn't find that project or role.",
        409: "You already have a pending request, an invitation, or a place on this project.",
      };
      setSubmitError(
        messages[error.status] ?? "Something went wrong. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (openRoles.length === 0 || !selectedRole) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.cardTitle}>{project.title}</h1>
          <EmptyState
            title={
              openRoles.length === 0
                ? "No open roles available"
                : "Choose an open role first"
            }
            text="Select an open role and review its requirements before sending a request."
          >
            <Button fullWidth onClick={() => navigate(projectDetailsPath)}>
              Back to project details
            </Button>
          </EmptyState>
        </section>
      </main>
    );
  }

  const isSent = hasSentRequest;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>
          {isSent ? "Request sent" : "Request a role"}
        </h1>
        <p className={styles.subtitle}>
          {project.title} · {selectedRole.title} · {roleHours}
          {project.durationWeeks != null && ` · ${project.durationWeeks} weeks`}
        </p>
      </header>

      {isSent ? (
        <>
          <Alert variant="success" title="Request sent">
            Your request is pending{" "}
            {project.owner?.name
              ? `${project.owner.name}'s`
              : "the project owner's"}{" "}
            review. You have not joined the project.
          </Alert>
          <ProjectSummaryCard project={projectSummary} variant="short" />
          <Button
            fullWidth
            onClick={() =>
              sentRequestId
                ? navigate(
                    `/invitations/${encodeURIComponent(sentRequestId)}/commitment?variant=request&project=${encodeURIComponent(projectId)}`,
                  )
                : navigate(projectDetailsPath)
            }
          >
            {sentRequestId ? "View request status" : "Back to project details"}
          </Button>
        </>
      ) : (
        <>
          {submitError && (
            <Alert variant="error" title="Request could not send">
              {submitError}
            </Alert>
          )}
          {isSubmitting && (
            <Alert variant="info" title="Sending request…">
              Sending your request. Please wait.
            </Alert>
          )}
          <div className={styles.cards}>
            <ProjectSummaryCard project={projectSummary} variant="short" />
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Your role and requirements</h2>
              {!requestedRoleId && (
                <Select
                  label="Open role"
                  value={String(roleId)}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setSelectedRoleId(event.target.value);
                    setSubmitError("");
                  }}
                  options={openRoles.map((role) => ({
                    value: String(role.id),
                    label: role.title,
                  }))}
                />
              )}
              <h3 className={styles.cardTitle}>{selectedRole.title}</h3>
              {selectedRole.description && (
                <p className={styles.body}>{selectedRole.description}</p>
              )}
              <p className={styles.body}>
                Required skills:{" "}
                {requiredSkills.length > 0
                  ? requiredSkills.join(" · ")
                  : "No required skills listed"}
              </p>
              <p className={styles.body}>
                Project skills:{" "}
                {projectSkills.length > 0
                  ? projectSkills.join(" · ")
                  : "No project skills listed"}
              </p>
              <p className={styles.body}>
                {roleHours}
                {project.durationWeeks != null &&
                  ` · ${project.durationWeeks} weeks`}
              </p>
              {selectedRole.requiredMembers != null && (
                <p className={styles.body}>
                  Required members: {selectedRole.requiredMembers}
                </p>
              )}
            </section>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Before you send</h2>
              <p className={styles.body}>
                The project owner will review your request. You join only after
                approval and confirmation.
              </p>
              <Button
                fullWidth
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Sending request…" : "Send request"}
              </Button>
              {submitError && (
                <Button
                  fullWidth
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  Retry
                </Button>
              )}
            </section>
          </div>
        </>
      )}

      <div className={styles.backBar}>
        <AltLink to={projectDetailsPath}>Back to project details</AltLink>
      </div>
    </main>
  );
}

function RequestRole() {
  const { projectId } = useParams();
  return <RequestRoleContent key={projectId} projectId={projectId} />;
}

export default RequestRole;
