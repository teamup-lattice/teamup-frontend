import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProjectDetails,
  getProjectMembers,
} from "../../services/projectDetailsService";
import {
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
  const [status, setStatus] = useState("loading");

  const loadDetails = useCallback((id) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    Promise.allSettled([getProjectDetails(id), getProjectMembers(id)]).then(
      ([projectResult, membersResult]) => {
        // Ignore answers to older requests (for example after changing project).
        if (requestId !== requestRef.current) return;

        if (projectResult.status === "rejected") {
          console.error("Failed to load project details:", projectResult.reason);
          setStatus(projectResult.reason.status === 404 ? "not-found" : "error");
          return;
        }

        const project = projectResult.value.project;
        const roles = project?.roles ?? [];
        const members =
          membersResult.status === "fulfilled"
            ? membersResult.value.members ?? []
            : [];

        setDetails({ project, roles, members });
        setSelectedRoleId((current) => {
          if (roles.some((role) => role.id === current)) return current;
          return roles[0]?.id ?? "";
        });
        setStatus("ready");
      },
    );
  }, []);

  useEffect(() => {
    loadDetails(projectId);
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

    setSelectedRoleId(roleId);
  };

  const handleRecheck = () => {
    shouldRestoreFocusRef.current = true;
    setStatus("loading");
    loadDetails(projectId);
  };

  const project = details?.project;
  const roles = details?.roles ?? [];
  const members = details?.members ?? [];
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const otherRoles = roles.filter((role) => role.id !== selectedRoleId);
  const isRoleClosed = selectedRole?.status === "CLOSED";

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
              membersCount={members.length}
              selectedRoleId={selectedRoleId}
              onRoleChange={handleRoleChange}
              selectRef={selectRef}
            />

            {selectedRole && (
              <RoleTermsCard role={selectedRole} project={project} />
            )}
            <MilestonesCard milestones={project.milestones} />

            {otherRoles.map((role) => (
              <OtherRoleCard key={role.id} role={role} project={project} />
            ))}

            {selectedRole && (
              <RequestCard
                project={project}
                role={selectedRole}
                onRequest={handleRequest}
              />
            )}
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
