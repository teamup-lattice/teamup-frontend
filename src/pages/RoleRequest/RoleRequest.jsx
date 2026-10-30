import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import MilestonesCard from "../../components/collab/MilestonesCard";
import ProjectSummaryCard from "../../components/collab/ProjectSummaryCard";
import RoleContributionCard from "../../components/collab/RoleContributionCard";
import { joinRequest, project, roles } from "../../data/collaborationData";
import { formatDate } from "../CreateProject/formatDate";
import styles from "./RoleRequest.module.css";

const requestRole = roles.frontend;
const supportedStates = ["pending", "approved", "declined"];

function RoleRequest() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedState = searchParams.get("state");
  const state = supportedStates.includes(requestedState)
    ? requestedState
    : "pending";

  const handleAction = () => {
    if (state === "approved") {
      navigate(`/invitations/${requestId}/commitment`);
    } else if (state === "declined") {
      navigate("/discover");
    } else {
      navigate("/projects");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Your role request</h1>
        <p className={styles.subtitle}>
          Campus Marketplace · John · Frontend Developer
        </p>
      </header>
      <div className={styles.cards}>
        <ProjectSummaryCard project={project} variant="short" />
        <RoleContributionCard role={requestRole} project={project} />
        <MilestonesCard
          milestones={project.milestones}
          taskDeadlines={requestRole.taskDeadlines}
        />
      </div>
      <section className={styles.status}>
        {state === "pending" && (
          <>
            <Alert variant="info" title="Pending Ada's approval">
              Request sent on {formatDate(joinRequest.receivedOn)}. You have not
              joined. Workspace access stays locked until approval and saved
              dated acceptance.
            </Alert>
            <Button variant="secondary" fullWidth onClick={handleAction}>
              Back to My Projects
            </Button>
          </>
        )}
        {state === "approved" && (
          <>
            <Alert variant="success" title="Approved — not joined">
              Approved, not joined. Review and save commitment acceptance to
              gain workspace access.
            </Alert>
            <Button fullWidth onClick={handleAction}>
              Review commitment
            </Button>
          </>
        )}
        {state === "declined" && (
          <>
            <Alert variant="info" title="Request declined">
              Request declined. You have not joined. Discover another Open
              project.
            </Alert>
            <Button fullWidth onClick={handleAction}>
              Discover Projects
            </Button>
          </>
        )}
      </section>
    </main>
  );
}

export default RoleRequest;
