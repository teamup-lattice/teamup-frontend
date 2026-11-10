import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import AvatarRow from "../../components/AvatarRow";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import {
  approveJoinRequest,
  declineJoinRequest,
  getJoinRequests,
} from "../../services/joinRequestsService";
import { getProjectById } from "../../services/projectService";
import styles from "./JoinRequests.module.css";

function requestErrorMessage(error) {
  if (error.status === 403) {
    return "Only the project owner or a manager can review join requests";
  }
  if (error.status === 404) return "We couldn't find that request.";
  if (error.status === 409) {
    return error.message && error.message !== "Something went wrong"
      ? error.message
      : "This request has already been answered, or the role is full or closed.";
  }
  return "Something went wrong. Try again.";
}

function JoinRequestsContent({ projectId }) {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [actionRequestId, setActionRequestId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      getProjectById(projectId),
      getJoinRequests(projectId, { status: "PENDING", page: 1, limit: 20 }),
    ])
      .then(([projectResponse, requestResponse]) => {
        if (!projectResponse?.project) {
          throw new Error("Project response is missing project data.");
        }
        if (!isCurrent) return;
        setProject(projectResponse.project);
        setRequests(requestResponse.requests);
        setPagination(requestResponse.pagination);
      })
      .catch((error) => {
        console.error("Failed to load project join requests:", error);
        if (isCurrent) setLoadError(requestErrorMessage(error));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, retryCount]);

  const retryLoad = () => {
    setLoadError("");
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  };

  const loadMore = async () => {
    if (!pagination || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadMoreError("");
    try {
      const response = await getJoinRequests(projectId, {
        status: "PENDING",
        page: pagination.page + 1,
        limit: 20,
      });
      setRequests((current) => [...current, ...response.requests]);
      setPagination(response.pagination);
    } catch (error) {
      setLoadMoreError(requestErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const decide = async (request, decision) => {
    if (actionRequestId !== null) return;
    setActionRequestId(request.id);
    setActionError("");
    setDecisionFeedback(null);
    try {
      if (decision === "APPROVED") {
        await approveJoinRequest(projectId, request.id);
      } else {
        await declineJoinRequest(projectId, request.id);
      }

      setRequests((current) =>
        current.filter((item) => String(item.id) !== String(request.id)),
      );
      setPagination((current) =>
        current
          ? { ...current, total: Math.max(0, current.total - 1) }
          : current,
      );
      setDecisionFeedback({
        title: decision === "APPROVED" ? "Request approved" : "Request declined",
        message:
          decision === "APPROVED"
            ? "Awaiting commitment. The requester must review and save acceptance to join."
            : "Your decision is saved. The requester has not joined and cannot access the workspace.",
      });
    } catch (error) {
      setActionError(requestErrorMessage(error));
    } finally {
      setActionRequestId(null);
    }
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p role="status">Loading requests…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className={styles.page}>
        <Alert variant="error" title="Couldn't load join requests">
          {loadError}
        </Alert>
        <Button fullWidth onClick={retryLoad}>
          Retry
        </Button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Review join requests</h1>
        <p className={styles.subtitle}>
          Owner or manager recruitment management · {project.title}
        </p>
      </header>

      <nav className={styles.tabs} aria-label="Recruitment">
        <Button variant="secondary" fullWidth className={styles.tabActive} disabled>
          Join requests · {pagination?.total ?? requests.length} pending
        </Button>
        <AltLink to="/collaborators">Find Collaborators</AltLink>
      </nav>

      {decisionFeedback && (
        <Alert variant="success" title={decisionFeedback.title}>
          {decisionFeedback.message}
        </Alert>
      )}
      {actionRequestId !== null && (
        <Alert variant="info" title="Saving Owner decision…">
          The requester has no access while this saves. Do not submit another
          decision.
        </Alert>
      )}
      {actionError && (
        <Alert variant="error" title="Request action could not be completed">
          {actionError}
        </Alert>
      )}
      {loadMoreError && (
        <>
          <Alert variant="error" title="Couldn't load more requests">
            {loadMoreError}
          </Alert>
          <Button
            variant="secondary"
            fullWidth
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            Retry
          </Button>
        </>
      )}

      <section className={styles.content}>
        {requests.length === 0 ? (
          <section className={styles.card}>
            <EmptyState
              title="No pending requests"
              text="New requests for this project will appear here."
            >
              <Button fullWidth onClick={() => navigate("/collaborators")}>
                Find Collaborators
              </Button>
            </EmptyState>
          </section>
        ) : (
          requests.map((request) => {
            const isActing = String(actionRequestId) === String(request.id);
            return (
              <article className={styles.card} key={request.id}>
                <h2 className={styles.cardTitle}>
                  {request.requester.name || "Applicant"}&apos;s request
                </h2>
                <AvatarRow
                  initial={request.requester.name.charAt(0)}
                  text={[
                    request.requester.name,
                    request.requester.headline,
                    request.role.title,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <p className={styles.helper}>
                  {request.statusLabel}
                  {request.createdAt && ` · Received ${request.createdAt}`}
                </p>
                {request.message && (
                  <div>
                    <p className={styles.label}>Message</p>
                    <p className={styles.body}>{request.message}</p>
                  </div>
                )}
                {request.proposedHoursPerWeek != null && (
                  <p className={styles.emphasis}>
                    {request.proposedHoursPerWeek} h / week
                  </p>
                )}
                {request.plannedTaskDeadlines && (
                  <div>
                    <p className={styles.label}>Planned task deadlines</p>
                    <p className={styles.body}>
                      {request.plannedTaskDeadlines}
                    </p>
                  </div>
                )}
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={isActing || actionRequestId !== null}
                  onClick={() =>
                    navigate(
                      `/role-requests/${encodeURIComponent(request.id)}?project=${encodeURIComponent(projectId)}`,
                    )
                  }
                >
                  Review request
                </Button>
                <Button
                  fullWidth
                  loading={isActing}
                  loadingText="Approving…"
                  disabled={actionRequestId !== null}
                  onClick={() => decide(request, "APPROVED")}
                >
                  Approve request
                </Button>
                <div className={styles.dangerButton}>
                  <Button
                    fullWidth
                    disabled={actionRequestId !== null}
                    onClick={() => decide(request, "DECLINED")}
                  >
                    {isActing ? "Saving decision…" : "Decline request"}
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {pagination && pagination.page < pagination.totalPages && (
        <Button
          variant="secondary"
          fullWidth
          loading={isLoadingMore}
          loadingText="Loading requests…"
          onClick={loadMore}
        >
          Load more
        </Button>
      )}
    </main>
  );
}

function JoinRequests() {
  const { projectId } = useParams();
  return <JoinRequestsContent key={projectId} projectId={projectId} />;
}

export default JoinRequests;
