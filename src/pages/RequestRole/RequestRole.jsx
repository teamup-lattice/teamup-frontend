import { useSearchParams, useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import Skeleton from "../../components/Skeleton";
import MilestonesCard from "../../components/collab/MilestonesCard";
import ProjectSummaryCard from "../../components/collab/ProjectSummaryCard";
import RoleContributionCard from "../../components/collab/RoleContributionCard";
import { people, project, roles } from "../../data/collaborationData";
import styles from "./RequestRole.module.css";

const requestRole = roles.frontend;
const requester = people.john;
const supportedStates = ["default", "missing", "saving", "failed", "sent"];

function RequestRole() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedState = searchParams.get("state");
  const state = supportedStates.includes(requestedState)
    ? requestedState
    : "default";
  const projectDetailsPath = `/projects/${projectId}`;

  const setPreviewState = (nextState) => {
    setSearchParams({ state: nextState });
  };

  if (state === "missing") {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.cardTitle}>{project.name}</h1>
          <EmptyState
            title="Choose an open role first"
            text="Select a role and review its requirements before sending a request."
          >
            <Button
              fullWidth
              onClick={() => setPreviewState("default")}
            >
              Choose role
            </Button>
          </EmptyState>
          <Button fullWidth disabled>
            Send request
          </Button>
        </section>
      </main>
    );
  }

  if (state === "saving") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Frontend Developer request</h1>
          <p className={styles.subtitle}>
            John · 8 h / week · 6 weeks
          </p>
        </header>
        <Alert variant="info" title="Sending request…">
          Sending. Request not yet saved; submit temporarily locked.
        </Alert>
        <div className={styles.skeletons}>
          <Skeleton />
          <Skeleton />
        </div>
        <div className={styles.loadingBar} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Sending request…
        </div>
      </main>
    );
  }

  if (state === "failed") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Frontend Developer request</h1>
          <p className={styles.subtitle}>
            Campus Marketplace · 8 h / week · 6 weeks
          </p>
        </header>
        <Alert variant="error" title="Request could not send">
          Role and input retained. Check request status and role before
          retrying. Request and membership not confirmed.
        </Alert>
        <Button fullWidth>
          Recheck request status
        </Button>
        <AltLink to={projectDetailsPath}>Back to project details</AltLink>
      </main>
    );
  }

  if (state === "sent") {
    return (
      <main className={styles.page}>
        <Alert variant="success" title="Request sent">
          Pending Ada&apos;s review. You have not joined Campus Marketplace.
        </Alert>
        <RoleContributionCard role={requestRole} project={project} />
        <Button fullWidth>View request status</Button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Request a role</h1>
        <p className={styles.subtitle}>
          Campus Marketplace · {requester.name} · {requestRole.title}
        </p>
      </header>
      <div className={styles.cards}>
        <ProjectSummaryCard project={project} variant="short" />
        <RoleContributionCard role={requestRole} project={project} />
        <MilestonesCard
          milestones={project.milestones}
          taskDeadlines={requestRole.taskDeadlines}
        />
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Before you send</h2>
          <p className={styles.body}>
            Stated requirements met: Frontend development, React, 8 h / week
            for 6 weeks.
          </p>
          <p className={styles.body}>
            Ada reviews your request. Joining requires approval and saved
            commitment acceptance.
          </p>
          <Button fullWidth onClick={() => setPreviewState("saving")}>
            Send request
          </Button>
        </section>
      </div>
      <div className={styles.backBar}>
        <AltLink to={projectDetailsPath}>
          Back to project details
        </AltLink>
      </div>
    </main>
  );
}

export default RequestRole;
