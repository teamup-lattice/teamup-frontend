import { useWorkspace } from "../../useWorkspace";

function WorkspaceOverview() {
  useWorkspace();
  return <h1>Workspace Overview</h1>;
}

export default WorkspaceOverview;
