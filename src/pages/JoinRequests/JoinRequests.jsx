import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import AvatarRow from "../../components/AvatarRow";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import Select from "../../components/Select";
import Skeleton from "../../components/Skeleton";
import MilestonesCard from "../../components/collab/MilestonesCard";
import RoleContributionCard from "../../components/collab/RoleContributionCard";
import { joinRequest, people, project, roles } from "../../data/collaborationData";
import { formatDate } from "../CreateProject/formatDate";
import styles from "./JoinRequests.module.css";

const applicant = people[joinRequest.from];
const applicantRole = roles[joinRequest.roleKey];
const projectOptions = [
  { value: "campus-marketplace", label: `${project.name} · Open` },
];
const supportedStates = [
  "default",
  "empty",
  "failed",
  "saving",
  "approved",
  "declined",
  "guard",
];

function ApplicantCard() {
  return (
    <article className={styles.card}>
      <h2 className={styles.cardTitle}>John&apos;s request</h2>
      <AvatarRow
        initial={applicant.name.charAt(0)}
        text={`${applicant.name} · ${applicantRole.title}`}
      />
      <p className={styles.helper}>
        Pending · Received {formatDate(joinRequest.receivedOn)}
      </p>
      <p className={styles.label}>Self-reported skills and availability</p>
      <p className={styles.body}>{applicant.skills.join(" · ")}</p>
      <p className={styles.emphasis}>
        {applicant.hours} h / week · {applicant.weeks} weeks
      </p>
      <div>
        <p className={styles.label}>Goal</p>
        <p className={styles.body}>{applicant.goal}</p>
      </div>
      <p className={styles.helper}>
        Contact hidden until joining; Owner approval alone is not membership.
      </p>
    </article>
  );
}

function JoinRequests() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedState = searchParams.get("state");
  const state = supportedStates.includes(requestedState)
    ? requestedState
    : "default";

  const setState = (nextState) => setSearchParams({ state: nextState });
  const goToRequestList = () =>
    navigate(`/projects/${projectId}/join-requests`);

  if (state === "guard") {
    return (
      <main className={styles.page}>
        <Alert variant="error" title="This review is for the project Owner">
          Owner access required. You cannot view private requests or make
          decisions. Return to My Projects.
        </Alert>
        <Button variant="secondary" fullWidth onClick={() => navigate("/projects")}>
          My Projects
        </Button>
      </main>
    );
  }

  if (state === "saving") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>John · Frontend Developer</h1>
          <p className={styles.subtitle}>Pending request · 18 Oct 2026</p>
        </header>
        <Alert variant="info" title="Saving Owner decision…">
          John has no access while this saves. Do not submit another decision.
        </Alert>
        <div className={styles.skeletons}>
          <Skeleton />
          <Skeleton />
        </div>
        <div className={styles.loadingBar} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Saving decision…
        </div>
        <div className={styles.dangerButton}>
          <Button fullWidth disabled>
            Decline request
          </Button>
        </div>
      </main>
    );
  }

  if (state === "approved" || state === "declined") {
    return (
      <main className={styles.page}>
        <section className={styles.statusCard}>
          <h1 className={styles.cardTitle}>John&apos;s request</h1>
          <Alert
            variant="success"
            title={
              state === "approved" ? "Request approved" : "Request declined"
            }
          >
            {state === "approved"
              ? "Awaiting commitment. John must review and save acceptance to join."
              : "Your decision is saved. John has not joined and cannot access the workspace."}
          </Alert>
          <AvatarRow
            initial={applicant.name.charAt(0)}
            text={`${applicant.name} · ${applicantRole.title}`}
          />
          <p className={styles.body}>
            {applicant.hours} h / week · {applicant.weeks} weeks · {project.name}
          </p>
          <Button variant="secondary" fullWidth onClick={goToRequestList}>
            Back to join requests
          </Button>
        </section>
      </main>
    );
  }

  if (state === "empty") {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.cardTitle}>{project.name}</h1>
          <EmptyState
            title="No pending requests"
            text="Find eligible collaborators for a specific open role. Existing invitations do not create membership."
          >
            <Button
              fullWidth
              onClick={() => navigate("/find-collaborators")}
            >
              Find Collaborators
            </Button>
          </EmptyState>
        </section>
      </main>
    );
  }

  const isFailed = state === "failed";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Review join requests</h1>
        <p className={styles.subtitle}>
          Owner-only recruitment management · {project.name}
        </p>
      </header>
      {isFailed ? (
        <Alert variant="error" title="Decision could not save">
          John remains pending and has no workspace access. The request and
          role context are retained.
        </Alert>
      ) : (
        <Alert variant="info" title="Only Ada can decide">
          Check John&apos;s availability against current requirements. Owner-only
          view; applicants have no workspace access.
        </Alert>
      )}
      <section className={styles.content}>
        {!isFailed && (
          <>
            <Select
              label="Owned project"
              options={projectOptions}
              value="campus-marketplace"
              onChange={() => {}}
            />
            <nav className={styles.tabs} aria-label="Recruitment">
              <Button variant="secondary" fullWidth>
                Join requests · 1 pending
              </Button>
              <AltLink to="/invitations">Sent invitations</AltLink>
              <AltLink to="/find-collaborators">Find Collaborators</AltLink>
            </nav>
          </>
        )}
        {state === "default" && (
          <>
            <ApplicantCard />
            <RoleContributionCard role={applicantRole} project={project} />
            <MilestonesCard
              milestones={project.milestones}
              taskDeadlines={applicantRole.taskDeadlines}
            />
            <section className={styles.decisionCard}>
              <h2 className={styles.cardTitle}>Owner decision</h2>
              <p className={styles.body}>
                Approval lets John review his commitment; it does not create
                membership.
              </p>
              <Button fullWidth onClick={() => setState("saving")}>
                Approve request
              </Button>
              <div className={styles.dangerButton}>
                <Button fullWidth onClick={() => setState("saving")}>
                  Decline request
                </Button>
              </div>
            </section>
          </>
        )}
        {isFailed && (
          <>
            <ApplicantCard />
            <Button fullWidth onClick={() => setState("saving")}>
              Recheck current request
            </Button>
            <Button fullWidth onClick={() => setState("saving")}>
              Approve request
            </Button>
            <div className={styles.dangerButton}>
              <Button fullWidth onClick={() => setState("saving")}>
                Decline request
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default JoinRequests;
