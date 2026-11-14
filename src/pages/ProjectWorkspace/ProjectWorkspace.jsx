import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Select from "../../components/Select";
import {
  projectUpdates,
  taskComments,
  tasks,
} from "../../data/workspaceData";
import { getProjectMilestones } from "../../services/milestonesService";
import {
  getWorkspaceCurrentUser,
  getWorkspaceMembers,
  getWorkspaceProject,
} from "../../services/workspaceMembersService";
import StatusTag from "./shared/StatusTag";
import styles from "./ProjectWorkspace.module.css";
import "./shared/workspaceVisuals.css";

const sectionOptions = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "updates", label: "Updates" },
  { value: "team", label: "Team" },
  { value: "team-health", label: "Team health" },
  { value: "milestones", label: "Milestones" },
  { value: "contributions", label: "Contributions" },
  { value: "completion", label: "Project completion" },
];

const mobileSectionOptions = [
  ...sectionOptions,
  { value: "sharing-privacy", label: "Sharing settings" },
];

function ProjectWorkspace() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [milestonesState, setMilestonesState] = useState({
    projectId: null,
    retryCount: 0,
    loading: true,
    error: "",
    data: [],
  });
  const [milestonesRetryCount, setMilestonesRetryCount] = useState(0);
  const [workspaceRetryCount, setWorkspaceRetryCount] = useState(0);
  const [membersRetryCount, setMembersRetryCount] = useState(0);
  const [workspaceState, setWorkspaceState] = useState({
    projectId: null,
    retryCount: 0,
    loading: true,
    error: "",
    project: null,
    currentUser: null,
  });
  const [membersState, setMembersState] = useState({
    projectId: null,
    retryCount: 0,
    loading: true,
    error: "",
    data: [],
  });
  const isMilestonesRequestCurrent =
    milestonesState.projectId === projectId &&
    milestonesState.retryCount === milestonesRetryCount;
  const milestones = isMilestonesRequestCurrent ? milestonesState.data : [];
  const milestonesLoading =
    !isMilestonesRequestCurrent || milestonesState.loading;
  const milestonesError = isMilestonesRequestCurrent
    ? milestonesState.error
    : "";
  const isWorkspaceRequestCurrent =
    workspaceState.projectId === projectId &&
    workspaceState.retryCount === workspaceRetryCount;
  const project = isWorkspaceRequestCurrent ? workspaceState.project : null;
  const currentUserProfile = isWorkspaceRequestCurrent
    ? workspaceState.currentUser
    : null;
  const workspaceLoading =
    !isWorkspaceRequestCurrent || workspaceState.loading;
  const workspaceError = isWorkspaceRequestCurrent
    ? workspaceState.error
    : "";
  const isMembersRequestCurrent =
    membersState.projectId === projectId &&
    membersState.retryCount === membersRetryCount;
  const members = isMembersRequestCurrent ? membersState.data : [];
  const membersLoading = !isMembersRequestCurrent || membersState.loading;
  const membersError = isMembersRequestCurrent ? membersState.error : "";
  const currentUserMembership = currentUserProfile
    ? members.find(
        (member) => String(member.userId) === String(currentUserProfile.id),
      )
    : null;
  const currentUser = {
    ...(currentUserMembership ?? {}),
    id: currentUserProfile?.id ?? "",
    name: currentUserMembership?.name ?? currentUserProfile?.name ?? "",
    role: currentUserMembership?.role ?? "",
    accessLevel: currentUserMembership?.accessLevel ?? "",
  };
  const isOwner =
    currentUser.accessLevel === "OWNER" ||
    (currentUser.id !== "" &&
      project?.ownerId != null &&
      String(project.ownerId) === String(currentUser.id));
  const canManageMembers =
    isOwner || currentUser.accessLevel === "MANAGER";

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      getWorkspaceProject(projectId),
      getWorkspaceCurrentUser(),
    ])
      .then(([loadedProject, loadedUser]) => {
        if (isCurrent) {
          setWorkspaceState({
            projectId,
            retryCount: workspaceRetryCount,
            loading: false,
            error: "",
            project: loadedProject,
            currentUser: loadedUser,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load workspace project or profile:", error);
        if (!isCurrent) return;
        setWorkspaceState({
          projectId,
          retryCount: workspaceRetryCount,
          loading: false,
          error: error.message || "Something went wrong. Try again.",
          project: null,
          currentUser: null,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, workspaceRetryCount]);

  useEffect(() => {
    let isCurrent = true;

    getWorkspaceMembers(projectId)
      .then((loadedMembers) => {
        if (isCurrent) {
          setMembersState({
            projectId,
            retryCount: membersRetryCount,
            loading: false,
            error: "",
            data: loadedMembers,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load workspace members:", error);
        if (!isCurrent) return;
        setMembersState({
          projectId,
          retryCount: membersRetryCount,
          loading: false,
          error: error.message || "Something went wrong. Try again.",
          data: [],
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, membersRetryCount]);

  useEffect(() => {
    let isCurrent = true;

    getProjectMilestones(projectId)
      .then((projectMilestones) => {
        if (isCurrent) {
          setMilestonesState({
            projectId,
            retryCount: milestonesRetryCount,
            loading: false,
            error: "",
            data: projectMilestones,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load project milestones:", error);
        if (!isCurrent) return;
        setMilestonesState({
          projectId,
          retryCount: milestonesRetryCount,
          loading: false,
          error: error.message || "Something went wrong. Try again.",
          data: [],
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, milestonesRetryCount]);

  const retryMilestones = () => {
    setMilestonesRetryCount((count) => count + 1);
  };

  const retryWorkspace = () => {
    setWorkspaceRetryCount((count) => count + 1);
    setMembersRetryCount((count) => count + 1);
  };

  const refreshMembers = async () => {
    setMembersState((current) => ({
      ...current,
      projectId,
      retryCount: membersRetryCount,
      loading: true,
      error: "",
    }));
    try {
      const loadedMembers = await getWorkspaceMembers(projectId);
      setMembersState({
        projectId,
        retryCount: membersRetryCount,
        loading: false,
        error: "",
        data: loadedMembers,
      });
      return loadedMembers;
    } catch (error) {
      setMembersState((current) => ({
        ...current,
        projectId,
        retryCount: membersRetryCount,
        loading: false,
        error: error.message || "Something went wrong. Try again.",
      }));
      throw error;
    }
  };

  const setWorkspaceMilestones = (update) => {
    setMilestonesState((current) => {
      const currentMilestones =
        current.projectId === projectId ? current.data : [];
      const data =
        typeof update === "function" ? update(currentMilestones) : update;
      return { ...current, data };
    });
  };

  const workspacePath = `/projects/${projectId}/workspace`;
  const currentSection = location.pathname.startsWith(`${workspacePath}/tasks`)
    ? "tasks"
    : location.pathname.startsWith(`${workspacePath}/updates`)
      ? "updates"
      : location.pathname.startsWith(`${workspacePath}/sharing-privacy`)
        ? "sharing-privacy"
        : location.pathname.startsWith(`${workspacePath}/team-health`)
          ? "team-health"
          : location.pathname.startsWith(`${workspacePath}/team`)
            ? "team"
            : location.pathname.startsWith(`${workspacePath}/milestones`)
              ? "milestones"
              : location.pathname.startsWith(`${workspacePath}/contributions`)
                ? "contributions"
                : location.pathname.startsWith(`${workspacePath}/completion`)
                  ? "completion"
                  : "overview";
  const workspaceContext = {
    project: project ?? {},
    members,
    milestones,
    tasks,
    comments: taskComments,
    updates: projectUpdates,
    currentUser,
    isOwner,
    canManageMembers,
    currentUserId: currentUser.id,
    workspaceLoading,
    workspaceError,
    membersLoading,
    membersError,
    retryWorkspace,
    refreshMembers,
    setMilestones: setWorkspaceMilestones,
    milestonesLoading,
    milestonesError,
    retryMilestones,
  };

  const sectionPath = (section) =>
    section === "overview" ? workspacePath : `${workspacePath}/${section}`;
  const navigationTarget = (path) => `${path}${location.search}`;
  const navClassName = ({ isActive }) =>
    `${styles.navLink}${isActive ? ` ${styles.active}` : ""}`;

  return (
    <div className={styles.workspace}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <span>My Projects</span>
        <span aria-hidden="true">/</span>
        <span>{project?.name || "Loading project..."}</span>
      </nav>

      <header className={styles.projectHeader}>
        <h1 className={styles.title}>{project?.name || "Loading project..."}</h1>
        <p className={styles.meta}>
          {project?.status && <StatusTag status={project.status} />}
          {currentUser.name && (
            <span>
              {[
                currentUser.name,
                currentUser.accessLevel,
                currentUser.role,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </p>
      </header>

      {workspaceError && (
        <div>
          <Alert variant="error" title="Couldn't load project details">
            {workspaceError}
          </Alert>
          <Button variant="secondary" onClick={retryWorkspace}>
            Retry
          </Button>
        </div>
      )}

      <nav className={styles.navigation} aria-label="Project sections">
        <div className={styles.mainTabs}>
          <NavLink
            to={navigationTarget(workspacePath)}
            end
            className={navClassName}
          >
            Overview
          </NavLink>
          <NavLink
            to={navigationTarget(
              `${workspacePath}/${currentSection === "team" ? "team" : "tasks"}`,
            )}
            className={navClassName}
          >
            {currentSection === "team" ? "Team" : "Tasks"}
          </NavLink>
          <NavLink
            to={navigationTarget(`${workspacePath}/updates`)}
            className={navClassName}
          >
            Updates
          </NavLink>
        </div>
        <div className={styles.subLinks}>
          <NavLink
            to={navigationTarget(
              `${workspacePath}/${currentSection === "team" ? "tasks" : "team"}`,
            )}
            className={navClassName}
          >
            {currentSection === "team" ? "Tasks" : "Team"}
          </NavLink>
          <NavLink
            to={navigationTarget(`${workspacePath}/team-health`)}
            className={navClassName}
          >
            Team health
          </NavLink>
          <NavLink
            to={navigationTarget(`${workspacePath}/milestones`)}
            className={navClassName}
          >
            Milestones
          </NavLink>
          <NavLink
            to={navigationTarget(`${workspacePath}/contributions`)}
            className={navClassName}
          >
            Contributions
          </NavLink>
          <NavLink
            to={navigationTarget(`${workspacePath}/completion`)}
            className={navClassName}
          >
            Project completion
          </NavLink>
        </div>
      </nav>

      <div className={styles.mobileSection}>
        <Select
          label="Project section"
          options={mobileSectionOptions.map((option) => ({
            ...option,
            value: sectionPath(option.value),
          }))}
          value={sectionPath(currentSection)}
          onChange={(event) =>
            navigate(navigationTarget(event.target.value))
          }
        />
      </div>

      <main className={styles.screen}>
        <Outlet context={workspaceContext} />
      </main>
    </div>
  );
}

export default ProjectWorkspace;
