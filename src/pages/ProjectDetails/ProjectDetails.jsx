import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import { getProjectDetails } from "../../services/projectDetailsService";
import {
  AgreementsCard,
  MilestonesCard,
  OtherRoleCard,
  OverviewCard,
  RequestCard,
  RoleTermsCard,
  TeamCard,
} from "./Sections";
import {
  ClosedRoleCard,
  ErrorCard,
  LoadingCard,
  NotFoundCard,
} from "./StateCards";
import styles from "./ProjectDetails.module.css";

function ProjectDetailsView({ projectId }) {
  const navigate = useNavigate();
  const requestRef = useRef(0);
  const selectRef = useRef(null);
  const shouldRestoreFocusRef = useRef(false);

  const [details, setDetails] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isRoleClosed, setIsRoleClosed] = useState(false);
  const [status, setStatus] = useState("loading");
  const [hasSelectionNotice, setHasSelectionNotice] = useState(false);

  const loadDetails = useCallback((id, roleId, source) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    getProjectDetails({ id, roleId, isRetry: source === "retry" })
      .then((result) => {
        // Ignore answers to older requests (for example after changing role twice).
        if (requestId !== requestRef.current) return;

        const role = result.roles.find((item) => item.id === result.selectedRoleId);

        setDetails(result);
        setSelectedRoleId(result.selectedRoleId);
        setIsRoleClosed(result.isRoleClosed);
        setHasSelectionNotice(
          source === "select" &&
            !result.isRoleClosed &&
            role.eligibility.isEligible,
        );
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load project details:", error);
        if (requestId !== requestRef.current) return;

        setStatus(error.code === "not_found" ? "not-found" : "error");
      });
  }, []);

  useEffect(() => {
    loadDetails(projectId, undefined, "initial");
  }, [projectId, loadDetails]);

  // The role select is replaced by the loading state while terms load, so
  // focus returns to it once the page settles.
  useEffect(() => {
    if (status !== "loading" && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      selectRef.current?.focus();
    }
  }, [status]);

  const handleRoleChange = (event) => {
    const roleId = event.target.value;
    if (!roleId) return;

    shouldRestoreFocusRef.current = true;
    setSelectedRoleId(roleId);
    setStatus("loading");
    setHasSelectionNotice(false);
    loadDetails(projectId, roleId, "select");
  };

  const handleRecheck = () => {
    shouldRestoreFocusRef.current = true;
    setStatus("loading");
    setHasSelectionNotice(false);
    loadDetails(projectId, selectedRoleId || undefined, "retry");
  };

  const project = details?.project;
  const roles = details?.roles ?? [];
  const profile = details?.profile;
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const otherRoles = roles.filter((role) => role.id !== selectedRoleId);

  // Recruitment only: there is no workspace or Owner contact link here.
  // Requesting is not joining; the request itself is the next screen.
  const handleRequest = () => {
    navigate(`/projects/${projectId}/request-role`, {
      state: { roleId: selectedRole.id },
    });
  };

  const showFullDetails = status === "ready" && !isRoleClosed;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Project details</h1>
      <p className={styles.description}>
        Review the project and role before requesting.
      </p>

      <Link className={styles.backLink} to="/discover">
        Back to discovery
      </Link>

      {showFullDetails && <span className={styles.badge}>Open</span>}

      <div className={styles.stack}>
        {status === "loading" && (
          <LoadingCard project={project} role={selectedRole} />
        )}

        {status === "not-found" && <NotFoundCard />}

        {status === "error" && (
          <ErrorCard
            project={project}
            roles={roles}
            selectedRoleId={selectedRoleId}
            onRoleChange={handleRoleChange}
            onRecheck={handleRecheck}
            selectRef={selectRef}
          />
        )}

        {status === "ready" && isRoleClosed && (
          <ClosedRoleCard
            project={project}
            roles={roles}
            selectedRoleId={selectedRoleId}
            onRoleChange={handleRoleChange}
            onBack={() => navigate("/discover")}
            selectRef={selectRef}
          />
        )}

        {showFullDetails && (
          <>
            <OverviewCard project={project} />
            <TeamCard
              project={project}
              roles={roles}
              selectedRoleId={selectedRoleId}
              onRoleChange={handleRoleChange}
              selectRef={selectRef}
            />

            {hasSelectionNotice && (
              <Alert variant="success" title={`${selectedRole.title} selected`}>
                Requirements met. Requesting is not joining.
              </Alert>
            )}

            <RoleTermsCard role={selectedRole} />
            <MilestonesCard
              milestones={project.milestones}
              taskDeadlines={selectedRole.taskDeadlines}
            />

            {otherRoles.map((role) => (
              <OtherRoleCard key={role.id} role={role} profile={profile} />
            ))}

            <AgreementsCard
              agreements={project.agreements}
              proposal={project.responseWindowProposal}
            />
            <RequestCard
              project={project}
              role={selectedRole}
              profile={profile}
              onRequest={handleRequest}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Keyed by project id so opening another project starts from the loading state.
function ProjectDetails() {
  const { id } = useParams();

  return <ProjectDetailsView key={id} projectId={id} />;
}

export default ProjectDetails;
