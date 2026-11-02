import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Select from "../../components/Select";
import {
  members,
  milestones,
  projectUpdates,
  taskComments,
  tasks,
  workspaceProject,
} from "../../data/workspaceData";
import styles from "./ProjectWorkspace.module.css";

const sectionOptions = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "updates", label: "Updates" },
  { value: "team", label: "Team" },
  { value: "milestones", label: "Milestones" },
];

function ProjectWorkspace() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUserName] = useState(() =>
    new URLSearchParams(location.search).get("as") === "david" ? "David" : "Ada",
  );
  const currentUser =
    members.find((member) => member.name === currentUserName) ?? members[0];
  const isOwner = currentUser.name === workspaceProject.ownerName;
  const workspacePath = `/projects/${projectId}/workspace`;
  const currentSection = location.pathname.startsWith(`${workspacePath}/tasks`)
    ? "tasks"
    : location.pathname.startsWith(`${workspacePath}/updates`)
      ? "updates"
      : location.pathname.startsWith(`${workspacePath}/team`)
        ? "team"
        : location.pathname.startsWith(`${workspacePath}/milestones`)
          ? "milestones"
          : "overview";
  const workspaceContext = {
    project: workspaceProject,
    members,
    milestones,
    tasks,
    comments: taskComments,
    updates: projectUpdates,
    currentUser,
    isOwner,
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
        <span>{workspaceProject.name}</span>
      </nav>

      <header className={styles.projectHeader}>
        <h1 className={styles.title}>{workspaceProject.name}</h1>
        <p className={styles.meta}>
          {workspaceProject.status} · {currentUser.name} ·{" "}
          {isOwner ? "Owner" : "Member"}
        </p>
      </header>

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
            to={navigationTarget(`${workspacePath}/tasks`)}
            className={navClassName}
          >
            Tasks
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
            to={navigationTarget(`${workspacePath}/team`)}
            className={navClassName}
          >
            Team
          </NavLink>
          <NavLink
            to={navigationTarget(`${workspacePath}/milestones`)}
            className={navClassName}
          >
            Milestones
          </NavLink>
          <span className={styles.disabled}>Contributions</span>
          <span className={styles.disabled}>Project completion</span>
        </div>
      </nav>

      <div className={styles.mobileSection}>
        <Select
          label="Project section"
          options={sectionOptions.map((option) => ({
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
