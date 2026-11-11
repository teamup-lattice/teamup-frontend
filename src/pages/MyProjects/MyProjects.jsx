import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Select from "../../components/Select";
import listFilterIcon from "../../assets/list-filter.svg";
import { getMyProjects } from "../../services/myProjectsService";
import ProjectCard from "./ProjectCard";
import TeamHealthSummary from "./TeamHealthSummary";
import { STATUS_OPTIONS } from "./statusConfig";
import styles from "./MyProjects.module.css";

const NUMBER_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

function MyProjects() {
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");
  const [statusFilter, setStatusFilter] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [wasRefreshed, setWasRefreshed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getMyProjects()
      .then((data) => {
        if (!isMounted) return;

        setRecords(Array.isArray(data?.projects) ? data.projects : []);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load project records:", error);
        if (!isMounted) return;

        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);

    getMyProjects()
      .then((data) => {
        setRecords(Array.isArray(data?.projects) ? data.projects : []);
        setStatus("ready");
        setWasRefreshed(true);
      })
      .catch((error) => {
        console.error("Failed to refresh project records:", error);
      })
      .finally(() => setIsRetrying(false));
  };

  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setWasRefreshed(false);
  };

  const handleResetFilter = () => {
    setStatusFilter("");
    filterRef.current?.focus();
  };

  const isLoading = status === "loading";
  const allRecords = records;
  const hasRecords = allRecords.length > 0;
  const visibleRecords = statusFilter
    ? allRecords.filter((project) => project.status === statusFilter)
    : allRecords;
  const isFilteredEmpty =
    !isLoading && hasRecords && visibleRecords.length === 0;
  const loadedCount = `${NUMBER_WORDS[allRecords.length] ?? allRecords.length} project ${
    allRecords.length === 1 ? "record" : "records"
  } loaded`;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>My Projects</h1>
      <p className={styles.description}>
        Your drafts, active work and project records.
      </p>

      <div className={`${styles.fullWidth} ${styles.create}`}>
        <Button fullWidth onClick={() => navigate("/projects/new")}>
          Create project
        </Button>
      </div>

      <div className={styles.fullWidth}>
        <Select
          ref={filterRef}
          label="Filter by project status"
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={handleFilterChange}
        />
      </div>

      {status === "error" && (
        <div className={styles.fullWidth}>
          <Alert variant="error" title="Project records could not refresh">
            {hasRecords
              ? "Load failed. Filter retained; showing your last saved records."
              : "Load failed. Retry to load your project records."}
          </Alert>
          <Button
            variant="secondary"
            fullWidth
            loading={isRetrying}
            loadingText="Retrying..."
            onClick={handleRetry}
          >
            Retry refresh
          </Button>
        </div>
      )}

      {wasRefreshed && status === "ready" && (
        <div className={styles.fullWidth}>
          <Alert variant="success" title={loadedCount}>
            Project statuses updated.
          </Alert>
        </div>
      )}

      {isLoading && (
        <div className={styles.fullWidth} aria-busy="true">
          <p className={styles.loadingText} role="status">
            Loading your project records...
          </p>
          <ul className={styles.grid} aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <li className={styles.skeleton} key={index}>
                <span className={styles.barBadge} />
                <span className={styles.barTitle} />
                <span className={styles.bar} />
                <span className={styles.barShort} />
                <span className={styles.barButton} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && visibleRecords.length > 0 && (
        <ul className={styles.grid}>
          {visibleRecords.map((project) => (
            <li className={styles.item} key={project.id}>
              {project.id === "campus-marketplace" ? (
                <TeamHealthSummary>
                  <ProjectCard project={project} />
                </TeamHealthSummary>
              ) : (
                <ProjectCard project={project} />
              )}
            </li>
          ))}
        </ul>
      )}

      {isFilteredEmpty && (
        <>
          <section
            className={styles.emptyState}
            aria-labelledby="my-projects-empty-title"
          >
            <img
              className={styles.emptyStateIcon}
              src={listFilterIcon}
              alt=""
              aria-hidden="true"
            />
            <h2 className={styles.emptyTitle} id="my-projects-empty-title">
              No projects in this status
            </h2>
            <p className={styles.emptyText}>
              No {statusFilter} projects. Reset the filter to see your other
              projects.
            </p>
            <Button onClick={handleResetFilter}>Reset status filter</Button>
          </section>
          <div className={styles.emptyFooter}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate("/projects/new")}
            >
              Create project
            </Button>
          </div>
        </>
      )}

      {!isLoading && status === "ready" && !hasRecords && (
        <section className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Your first project starts here</h2>
          <p className={styles.emptyText}>
            No projects yet. Discover an Open project or create your own.
          </p>
          <Button onClick={() => navigate("/discover")}>
            Discover Projects
          </Button>
        </section>
      )}
    </div>
  );
}

export default MyProjects;
