import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup/Signup";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Welcome from "./pages/Welcome/Welcome";
import Profile from "./pages/Profile/Profile";
import RequiredProfile from "./pages/RequiredProfile/RequiredProfile";
import MyProjects from "./pages/MyProjects/MyProjects";
import ProjectDetails from "./pages/ProjectDetails/ProjectDetails";
import CreateProject from "./pages/CreateProject/CreateProject";
import ProjectPage from "./pages/ProjectPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing/Landing";
import DiscoverProjects from "./pages/DiscoverProjects/DiscoverProjects";
import FindCollaborators from "./pages/FindCollaborators/FindCollaborators";
import RequestRole from "./pages/RequestRole/RequestRole";
import RoleRequest from "./pages/RoleRequest/RoleRequest";
import JoinRequests from "./pages/JoinRequests/JoinRequests";
import InvitationDetails from "./pages/InvitationDetails/InvitationDetails";
import ReviewCommitment from "./pages/ReviewCommitment/ReviewCommitment";
import ProjectWorkspace from "./pages/ProjectWorkspace/ProjectWorkspace";
import WorkspaceOverview from "./pages/ProjectWorkspace/screens/WorkspaceOverview/WorkspaceOverview";
import Tasks from "./pages/ProjectWorkspace/screens/Tasks/Tasks";
import CreateTask from "./pages/ProjectWorkspace/screens/CreateTask/CreateTask";
import TaskDetail from "./pages/ProjectWorkspace/screens/TaskDetail/TaskDetail";
import ReassignTask from "./pages/ProjectWorkspace/screens/ReassignTask/ReassignTask";
import Team from "./pages/ProjectWorkspace/screens/Team/Team";
import ReleaseRole from "./pages/ProjectWorkspace/screens/ReleaseRole/ReleaseRole";
import Reminders from "./pages/ProjectWorkspace/screens/Reminders/Reminders";
import ProjectUpdates from "./pages/ProjectWorkspace/screens/ProjectUpdates/ProjectUpdates";
import Milestones from "./pages/ProjectWorkspace/screens/Milestones/Milestones";

function ContributionsPlaceholder() {
  return <h2>Contributions</h2>;
}

function CompletionPlaceholder() {
  return <h2>Project completion</h2>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile/setup" element={<RequiredProfile />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/discover" element={<DiscoverProjects />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects" element={<MyProjects />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id/edit" element={<CreateProject />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/collaborators" element={<FindCollaborators />} />
        <Route
          path="/projects/:projectId/request-role"
          element={<RequestRole />}
        />
        <Route path="/role-requests/:requestId" element={<RoleRequest />} />
        <Route
          path="/projects/:projectId/join-requests"
          element={<JoinRequests />}
        />
        <Route
          path="/invitations/:invitationId"
          element={<InvitationDetails />}
        />
        <Route
          path="/invitations/:invitationId/commitment"
          element={<ReviewCommitment />}
        />
        <Route
          path="/projects/:projectId/workspace"
          element={<ProjectWorkspace />}
        >
          <Route index element={<WorkspaceOverview />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/new" element={<CreateTask />} />
          <Route path="tasks/:taskId" element={<TaskDetail />} />
          <Route path="tasks/:taskId/reassign" element={<ReassignTask />} />
          <Route path="team" element={<Team />} />
          <Route path="team/release-role" element={<ReleaseRole />} />
          <Route
            path="contributions"
            element={<ContributionsPlaceholder />}
          />
          <Route path="completion" element={<CompletionPlaceholder />} />
          <Route path="milestones" element={<Milestones />} />
          <Route path="updates" element={<ProjectUpdates />} />
          <Route path="reminders" element={<Reminders />} />
        </Route>
      </Route>
      <Route path="/projects/:id" element={<ProjectDetails />} />
      <Route path="/projects/:id/page" element={<ProjectPage />} />
    </Routes>
  );
}

export default App;
