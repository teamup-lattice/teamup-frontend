import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup/Signup";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Welcome from "./pages/Welcome/Welcome";
import Profile from "./pages/Profile";
import RequiredProfile from "./pages/RequiredProfile/RequiredProfile";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject/CreateProject";
import ProjectDetails from "./pages/ProjectDetails";
import Workspace from "./pages/Workspace";
import ProjectPage from "./pages/ProjectPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing/Landing";

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
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id/edit" element={<CreateProject />} />
      </Route>
      <Route path="/projects/:id" element={<ProjectDetails />} />
      <Route path="/projects/:id/workspace" element={<Workspace />} />
      <Route path="/projects/:id/page" element={<ProjectPage />} />
    </Routes>
  );
}

export default App;
