import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AvatarRow from "../../components/AvatarRow";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import Select from "../../components/Select";
import Skeleton from "../../components/Skeleton";
import { getMyProfile } from "../../services/dashboardService";
import { getSkills } from "../../services/profileService";
import {
  inviteCollaborator,
  getMyProjects,
  getProjectCollaborators,
} from "../../services/myProjectsService";
import styles from "./FindCollaborators.module.css";

const PROJECT_TYPES = [
  "WEB_APPLICATION",
  "MOBILE_APP",
  "DESKTOP_APP",
  "API_SERVICE",
  "DATA_SCIENCE",
  "DESIGN",
  "OTHER",
];
const EMPTY_FILTERS = {
  skill: "",
  projectType: "",
  duration: "",
  hours: "",
};

function labelFor(value) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function OptionalFilters({
  values,
  onChange,
  onReset,
  skills,
  projectTypes,
  durations,
  hours,
}) {
  const setValue = (key) => (event) => {
    onChange({ ...values, [key]: event.target.value });
  };

  return (
    <section className={styles.filterCard}>
      <h2 className={styles.cardTitle}>Optional filters</h2>
      <div className={styles.filterFields}>
        <Select
          label="Skill"
          options={skills}
          value={values.skill}
          onChange={setValue("skill")}
          placeholder=""
        />
        <Select
          label="Project type"
          options={projectTypes}
          value={values.projectType}
          onChange={setValue("projectType")}
          placeholder=""
        />
        <Select
          label="Duration"
          options={durations}
          value={values.duration}
          onChange={setValue("duration")}
          placeholder=""
        />
        <Select
          label="Weekly hours"
          options={hours}
          value={values.hours}
          onChange={setValue("hours")}
          placeholder=""
        />
      </div>
      <button className={styles.textLink} type="button" onClick={onReset}>
        Reset optional filters
      </button>
      <p className={styles.helper}>
        The selected open role remains required for every result.
      </p>
    </section>
  );
}

function FindCollaborators() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProjectId = searchParams.get("project");
  const navigate = useNavigate();
  const [inviteAction, setInviteAction] = useState({
    status: "idle",
    userId: "",
    user: null,
    error: "",
  });
  const inviteInFlight = useRef(false);
  const [setupAttempt, setSetupAttempt] = useState(0);
  const [setup, setSetup] = useState({
    status: "loading",
    projects: [],
    skills: [],
    userId: null,
    error: null,
  });
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [requestAttempt, setRequestAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviewedUserId, setReviewedUserId] = useState("");
  const reviewCardRef = useRef(null);
  const profileCardRef = useRef(null);
  const hasOpenedReview = useRef(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getMyProjects(), getMyProfile(), getSkills()])
      .then(([projectsResponse, profileResponse, skillsResponse]) => {
        const projects = Array.isArray(projectsResponse?.projects)
          ? projectsResponse.projects
          : [];
        const userId = profileResponse?.user?.id;
        if (userId == null) {
          throw new Error("Profile response is missing the current user.");
        }

        const selectedProject = requestedProjectId
          ? projects.find(
              (project) => String(project.id) === requestedProjectId,
            )
          : projects.find(
              (project) =>
                project.status === "OPEN" &&
                String(project.ownerId) === String(userId),
            );
        const skills = Array.isArray(skillsResponse?.skills)
          ? skillsResponse.skills.filter(
              (skill) =>
                skill?.id != null &&
                typeof skill.name === "string" &&
                skill.name.trim(),
            )
          : [];
        const openRoles =
          selectedProject?.roles?.filter((role) => role.status === "OPEN") ??
          [];

        if (isMounted) {
          setSetup({
            status: "ready",
            projects,
            skills,
            userId,
            error: null,
          });
          setSelectedProjectId(
            selectedProject ? String(selectedProject.id) : "",
          );
          setSelectedRoleId(openRoles[0] ? String(openRoles[0].id) : "");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSetup({
            status: "error",
            projects: [],
            skills: [],
            userId: null,
            error,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requestedProjectId, setupAttempt]);

  const project =
    setup.projects.find(
      (item) => String(item.id) === selectedProjectId,
    ) ?? null;
  const openRoles = project?.roles?.filter((role) => role.status === "OPEN") ?? [];
  const role =
    openRoles.find((item) => String(item.id) === selectedRoleId) ??
    openRoles[0] ??
    null;
  const queryKey =
    setup.status === "ready" && project && role
      ? JSON.stringify([
          project.id,
          role.id,
          filters,
          requestAttempt,
        ])
      : "";
  const currentResults = results?.key === queryKey ? results : null;
  const projectOptions = setup.projects
    .filter(
      (item) =>
        item.status === "OPEN" || String(item.id) === selectedProjectId,
    )
    .map((item) => ({
      value: String(item.id),
      label: `${item.title}${item.status === "OPEN" ? " · Open" : ""}`,
    }));
  const skillOptions = setup.skills.map((skill) => ({
    value: String(skill.id),
    label: skill.name,
  }));
  const projectTypeOptions = PROJECT_TYPES.map((type) => ({
    value: type,
    label: labelFor(type),
  }));
  const durationOptions = Array.from({ length: 52 }, (_, index) => {
    const weeks = index + 1;
    return { value: String(weeks), label: `${weeks} weeks` };
  });
  const hourValues = [
    ...new Set(
      openRoles
        .map((item) => item.hoursPerWeek)
        .filter((hours) => Number.isInteger(hours) && hours > 0),
    ),
  ].sort((a, b) => a - b);
  const hourOptions = hourValues.map((hours) => ({
    value: String(hours),
    label: `${hours} h / week`,
  }));
  const requiredSkills = (role?.skills ?? [])
    .map((entry) => entry?.skill?.name)
    .filter(Boolean);

  useEffect(() => {
    if (!queryKey || !project || !role) return undefined;
    let isCurrent = true;

    getProjectCollaborators(project.id, role.id, {
      skills: filters.skill ? [filters.skill] : [],
      projectType: filters.projectType || undefined,
      durationWeeks: filters.duration || undefined,
      weeklyHours: filters.hours || undefined,
      page: 1,
      limit: 20,
    })
      .then((response) => {
        if (!isCurrent) return;
        setResults({
          key: queryKey,
          status: "ready",
          users: response.users,
          count: response.count,
          pagination: response.pagination ?? {
            page: 1,
            totalPages: 1,
          },
          error: null,
        });
      })
      .catch((error) => {
        if (!isCurrent) return;
        setResults({
          key: queryKey,
          status: "error",
          users: [],
          count: 0,
          pagination: null,
          error,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [queryKey, project, role, filters]);

  useEffect(() => {
    if (reviewedUserId) {
      hasOpenedReview.current = true;
      reviewCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else if (hasOpenedReview.current) {
      profileCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      hasOpenedReview.current = false;
    }
  }, [reviewedUserId]);

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterSheetOpen(false);
    setReviewedUserId("");
  };
  const resetFilters = () => setDraftFilters(EMPTY_FILTERS);
  const filterCount = Object.values(filters).filter(Boolean).length;
  const filterSummary = [
    filters.skill &&
      `Skill: ${
        setup.skills.find((skill) => String(skill.id) === filters.skill)?.name ??
        ""
      }`,
    filters.projectType && `Type: ${labelFor(filters.projectType)}`,
    filters.duration && `Duration: ${filters.duration} weeks`,
    filters.hours && `Weekly hours: ${filters.hours} h / week`,
  ].filter(Boolean);

  const changeProject = (event) => {
    const nextProject = setup.projects.find(
      (item) => String(item.id) === event.target.value,
    );
    const nextOpenRole =
      nextProject?.roles?.find((item) => item.status === "OPEN") ?? null;
    setSelectedProjectId(event.target.value);
    setSelectedRoleId(nextOpenRole ? String(nextOpenRole.id) : "");
    setReviewedUserId("");
  };
  const changeRole = (event) => {
    setSelectedRoleId(event.target.value);
    setReviewedUserId("");
  };

  const loadMore = async () => {
    if (!currentResults || !project || !role) return;
    setLoadingMore(true);
    try {
      const response = await getProjectCollaborators(project.id, role.id, {
        skills: filters.skill ? [filters.skill] : [],
        projectType: filters.projectType || undefined,
        durationWeeks: filters.duration || undefined,
        weeklyHours: filters.hours || undefined,
        page: currentResults.pagination.page + 1,
        limit: 20,
      });
      setResults((current) =>
        current?.key === queryKey
          ? {
              ...current,
              users: [...current.users, ...response.users],
              count: response.count,
              pagination: response.pagination,
            }
          : current,
      );
    } catch (error) {
      setResults((current) =>
        current?.key === queryKey
          ? { ...current, status: "error", error }
          : current,
      );
    } finally {
      setLoadingMore(false);
    }
  };

  if (setup.status === "loading") {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Find Collaborators</h1>
        <p role="status">Loading collaborators…</p>
      </div>
    );
  }

  if (setup.status === "error") {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Find Collaborators</h1>
        <Alert variant="error" title="Couldn't load collaborators">
          {setup.error?.status === 403
            ? "Only the project owner or a manager can find collaborators"
            : "Please try again."}
        </Alert>
        <Button
          onClick={() => {
            setSetup((current) => ({
              ...current,
              status: "loading",
              error: null,
            }));
            setSetupAttempt((attempt) => attempt + 1);
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Find Collaborators</h1>
        <EmptyState
          title="No project available"
          text="You don't have an open project to find collaborators for"
        >
          <Button fullWidth onClick={() => navigate("/projects/new")}>
            Create project
          </Button>
        </EmptyState>
      </div>
    );
  }

  if (!role) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Find Collaborators</h1>
          <p className={styles.subtitle}>{project.title}</p>
        </header>
        <EmptyState
          title="No open roles"
          text="This project has no open roles to find collaborators for."
        >
          <Button fullWidth onClick={() => navigate("/projects/new")}>
            Create project
          </Button>
        </EmptyState>
      </div>
    );
  }

  const error = currentResults?.status === "error" ? currentResults.error : null;
  const loading = !currentResults;
  const reviewedUser =
    currentResults?.users.find((user) => String(user.id) === reviewedUserId) ??
    (inviteAction.userId === reviewedUserId ? inviteAction.user : null);
  const actionStatus =
    inviteAction.userId === reviewedUserId ? inviteAction.status : "idle";
  const isInvitationFailed = actionStatus === "failed";
  const isInvitationDone = actionStatus === "done";
  const clearFailureFlag = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("fail");
    setSearchParams(nextParams, { replace: true });
  };
  const cancelReview = () => {
    if (isInvitationFailed) clearFailureFlag();
    setReviewedUserId("");
  };
  const submitInvitation = async () => {
    if (!reviewedUser || inviteInFlight.current) return;

    inviteInFlight.current = true;
    setInviteAction({
      status: "saving",
      userId: String(reviewedUser.id),
      user: reviewedUser,
      error: "",
    });

    try {
      await inviteCollaborator({
        projectId: project.id,
        roleId: role.id,
        inviteeId: reviewedUser.id,
      });
      setResults((current) =>
        current?.key === queryKey
          ? {
              ...current,
              users: current.users.filter(
                (user) => String(user.id) !== String(reviewedUser.id),
              ),
              count: Math.max(0, current.count - 1),
            }
          : current,
      );
      setInviteAction({
        status: "done",
        userId: String(reviewedUser.id),
        user: reviewedUser,
        error: "",
      });
    } catch (requestError) {
      const message =
        requestError.status === 403
          ? "Only the project owner or a manager can send invitations"
          : requestError.status === 409
            ? requestError.message || "Couldn't send the invitation. Try again."
            : "Couldn't send the invitation. Try again.";
      setInviteAction({
        status: "failed",
        userId: String(reviewedUser.id),
        user: reviewedUser,
        error: message,
      });
    } finally {
      inviteInFlight.current = false;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Find Collaborators</h1>
        <p className={styles.subtitle}>
          {project.title} · {role.title}
        </p>
      </header>

      <Alert variant="info" title="Required for this role">
        {requiredSkills.length > 0 ? `${requiredSkills.join(" + ")} · ` : ""}
        {role.hoursPerWeek != null
          ? `${role.hoursPerWeek} h / week`
          : "Weekly hours not specified"}
        {project.durationWeeks != null
          ? ` · ${project.durationWeeks} weeks`
          : ""}
        . Results are matched to this open role.
      </Alert>

      <main className={styles.content}>
        <div className={styles.selectionFields}>
          <Select
            label="Owned project"
            options={projectOptions}
            value={selectedProjectId}
            onChange={changeProject}
            placeholder=""
          />
          <Select
            label="Open role"
            options={openRoles.map((item) => ({
              value: String(item.id),
              label: item.title,
            }))}
            value={String(role.id)}
            onChange={changeRole}
            placeholder=""
          />
        </div>

        <div className={styles.desktopFilters}>
          <OptionalFilters
            values={draftFilters}
            onChange={setDraftFilters}
            onReset={resetFilters}
            skills={skillOptions}
            projectTypes={projectTypeOptions}
            durations={durationOptions}
            hours={hourOptions}
          />
          <Button fullWidth onClick={applyFilters}>
            Apply filters
          </Button>
        </div>
        <div className={styles.mobileFilters}>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setDraftFilters(filters);
              setIsFilterSheetOpen(true);
            }}
          >
            Filters · {filterCount} applied
          </Button>
          <p className={styles.filterSummary}>{filterSummary.join(" · ")}</p>
        </div>

        {isFilterSheetOpen && (
          <div className={styles.sheetOverlay}>
            <section
              className={styles.sheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-sheet-title"
            >
              <div className={styles.sheetHeader}>
                <h2 className={styles.cardTitle} id="filter-sheet-title">
                  Filter collaborators
                </h2>
                <button
                  className={styles.textLink}
                  type="button"
                  onClick={() => {
                    setDraftFilters(filters);
                    setIsFilterSheetOpen(false);
                  }}
                >
                  Close
                </button>
              </div>
              <p className={styles.body}>
                {project.title} · {role.title}
              </p>
              <p className={styles.helper}>
                Apply to update results. Close to discard filter changes.
              </p>
              <OptionalFilters
                values={draftFilters}
                onChange={setDraftFilters}
                onReset={resetFilters}
                skills={skillOptions}
                projectTypes={projectTypeOptions}
                durations={durationOptions}
                hours={hourOptions}
              />
              <Button fullWidth onClick={applyFilters}>
                Apply changes
              </Button>
            </section>
          </div>
        )}

        <section className={styles.results}>
          {loading && (
            <>
              <div className={styles.skeletons}>
                <Skeleton />
                <Skeleton />
              </div>
              <p role="status">Loading collaborators…</p>
            </>
          )}
          {error && (
            <>
              <Alert variant="error" title="Couldn't load collaborators">
                {error.status === 403
                  ? "Only the project owner or a manager can find collaborators"
                  : "Please try again."}
              </Alert>
              <Button
                onClick={() => setRequestAttempt((attempt) => attempt + 1)}
              >
                Retry
              </Button>
            </>
          )}
          {!loading && !error && currentResults.users.length === 0 && (
            <EmptyState
              title="No matching collaborators"
              text="Try changing the optional filters for this role."
            />
          )}
          {!loading && !error && currentResults.users.length > 0 && (
            <>
              <h2 className={styles.sectionHeading}>
                {currentResults.count}{" "}
                {currentResults.count === 1
                  ? "person matches"
                  : "people match"}
              </h2>
              {currentResults.users.map((user) => {
                const userLabel = [user.name, user.headline]
                  .filter(Boolean)
                  .join(" · ");
                const availability = [
                  user.availability,
                  user.preferredDuration,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <article
                    className={styles.card}
                    key={user.id}
                    ref={
                      String(user.id) === reviewedUserId
                        ? profileCardRef
                        : undefined
                    }
                  >
                    <h3 className={styles.cardTitle}>Public profile preview</h3>
                    <AvatarRow
                      initial={user.name.charAt(0) || "?"}
                      text={userLabel}
                    />
                    {user.skills.length > 0 && (
                      <div>
                        <p className={styles.label}>Self-reported skills</p>
                        <p className={styles.body}>{user.skills.join(" · ")}</p>
                      </div>
                    )}
                    {availability && (
                      <p className={styles.emphasis}>{availability}</p>
                    )}
                    <p className={styles.helper}>
                      Public fields only. Contact details hidden, including from
                      the Owner.
                    </p>
                    <Button
                      fullWidth
                      disabled={inviteAction.status === "saving"}
                      onClick={() => {
                        setInviteAction({
                          status: "idle",
                          userId: String(user.id),
                          user,
                          error: "",
                        });
                        setReviewedUserId(String(user.id));
                      }}
                    >
                      Review invitation to {user.name}
                    </Button>
                  </article>
                );
              })}
              {currentResults.pagination.page <
                currentResults.pagination.totalPages && (
                <Button
                  variant="secondary"
                  fullWidth
                  loading={loadingMore}
                  loadingText="Loading more…"
                  onClick={loadMore}
                >
                  Load more
                </Button>
              )}
            </>
          )}

          {reviewedUser && (
            <article className={styles.card} ref={reviewCardRef}>
              <h3 className={styles.cardTitle}>Review invitation</h3>
              <p className={styles.emphasis}>
                Invite {reviewedUser.name} to {project.title}
              </p>
              <p className={styles.body}>
                {role.title}
                {role.hoursPerWeek != null
                  ? ` · ${role.hoursPerWeek} h / week`
                  : ""}
                {project.durationWeeks != null
                  ? ` · ${project.durationWeeks} weeks`
                  : ""}
              </p>
              {role.description && (
                <p className={styles.body}>{role.description}</p>
              )}
              {isInvitationFailed && (
                <Alert variant="error" title="Invitation could not send">
                  {inviteAction.error}
                </Alert>
              )}
              {isInvitationDone && (
                <Alert
                  variant="success"
                  title={`Invitation sent to ${reviewedUser.name}`}
                >
                  Pending response and saved commitment acceptance. The
                  collaborator has not joined.
                </Alert>
              )}
              <Button
                fullWidth
                disabled={actionStatus === "saving"}
                onClick={submitInvitation}
              >
                {isInvitationFailed
                  ? "Recheck invitation status"
                  : `Send invitation to ${reviewedUser.name}`}
              </Button>
              <button
                className={styles.textLink}
                type="button"
                onClick={cancelReview}
              >
                Cancel invitation review
              </button>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

export default FindCollaborators;
