import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup/Signup";
import Login from "./pages/Login/Login";
import Welcome from "./pages/Welcome/Welcome";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import ProjectDetails from "./pages/ProjectDetails";
import Workspace from "./pages/Workspace";
import ProjectPage from "./pages/ProjectPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import AppLayout from "./layouts/AppLayout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects" element={<Projects />} />
      </Route>
      <Route path="/projects/new" element={<CreateProject />} />
      <Route path="/projects/:id" element={<ProjectDetails />} />
      <Route path="/projects/:id/workspace" element={<Workspace />} />
      <Route path="/projects/:id/page" element={<ProjectPage />} />
    </Routes>
  );
}

export default App;
