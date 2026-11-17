import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import listFilterIcon from "../../assets/list-filter.svg";
import heroImage from "../../assets/landing-cta.png";
import {
  buildFilterFields,
  emptyFilters,
  normalizeFilters,
} from "../../data/discoverData";
import { getOpenProjects } from "../../services/discoverService";
import { getProfile } from "../../services/profileService";
import FilterPanel from "./FilterPanel";
import FilterSheet from "./FilterSheet";
import ProjectResultCard from "./ProjectResultCard";
import useIsWide from "./useIsWide";
import useSkillsCatalog from "./useSkillsCatalog";
import styles from "./DiscoverProjects.module.css";

// Filter panel next to the results when the page area is at least this wide;
// otherwise the "Filters" button and bottom sheet are used.
const WIDE_LAYOUT_MIN_WIDTH = 700;
const SEARCH_DELAY_MS = 300;

const COUNT_WORDS = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

const countWord = (count) => COUNT_WORDS[count] ?? String(count);
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const filterWord = (count) => (count === 1 ? "filter" : "filters");
const projectWord = (count) => (count === 1 ? "project" : "projects");
const eligibleProjects = (count) =>
  `${capitalize(countWord(count))} eligible Open ${projectWord(count)}`;

function getSelectedFilters(filters, fields) {
  return fields
    .filter((field) => !field.disabled && filters[field.key])
    .map((field) => ({
      label: field.summaryLabel,
      text:
        field.options.find((option) => option.value === filters[field.key])
          ?.label ?? filters[field.key],
    }));
}

function DiscoverProjects() {
  const pageRef = useRef(null);
  const filtersButtonRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const requestRef = useRef(0);
  const searchTimerRef = useRef(null);
  const appliedRef = useRef(emptyFilters);
  const isWide = useIsWide(pageRef, WIDE_LAYOUT_MIN_WIDTH);
  const {
    status: skillStatus,
    options: skillOptions,
    retry: retrySkills,
  } = useSkillsCatalog();
  const fields = useMemo(
    () => buildFilterFields(skillOptions),
    [skillOptions],
  );
  const skillIds = useMemo(
    () => new Set(skillOptions.map((option) => option.value)),
    [skillOptions],
  );

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [hasNotice, setHasNotice] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const fetchResults = useCallback(
    (nextQuery, nextFilters, source, page = 1, append = false) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      getOpenProjects({
        query: nextQuery,
        filters: nextFilters,
        page,
      })
        .then(({ projects: results, pagination }) => {
          // Ignore answers to older requests (for example while typing).
          if (requestId !== requestRef.current) return;

          const count = results.length;
          const pageNumber =
            typeof pagination?.page === "number" ? pagination.page : page;
          const pageCount =
            typeof pagination?.totalPages === "number"
              ? pagination.totalPages
              : 1;

          setProjects((current) =>
            append ? [...current, ...results] : results,
          );
          setTotal((current) =>
            typeof pagination?.total === "number"
              ? pagination.total
              : append
                ? current
                : count,
          );
          setCurrentPage(pageNumber);
          setTotalPages(pageCount);
          setStatus("ready");

          if (append) {
            setIsLoadingMore(false);
            setLoadMoreError("");
            return;
          }

          const isUserUpdate = source !== "initial" && source !== "search";
          const showNotice = isUserUpdate && count > 0;
          setHasNotice(showNotice);

          if (showNotice) {
            setAnnouncement("");
          } else {
            setAnnouncement(
              count > 0 ? `${eligibleProjects(count)}.` : "No results.",
            );
          }
        })
        .catch((error) => {
          console.error("Failed to load open projects:", error);
          if (requestId !== requestRef.current) return;

          if (append) {
            setIsLoadingMore(false);
            setLoadMoreError("Couldn't load more projects. Try again.");
          } else {
            setStatus("error");
          }
        });
    },
    [],
  );

  useEffect(() => {
    fetchResults("", emptyFilters, "initial");
  }, [fetchResults]);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const startFetch = (nextQuery, nextFilters, source) => {
    setStatus("loading");
    setHasNotice(false);
    setIsLoadingMore(false);
    setLoadMoreError("");
    fetchResults(nextQuery, nextFilters, source, 1, false);
  };

  // Search is not a filter: it updates results as you type, filters wait for Apply.
  const handleQueryChange = (event) => {
    const value = event.target.value;
    setQuery(value);

    window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      startFetch(value, appliedRef.current, "search");
    }, SEARCH_DELAY_MS);
  };

  const appliedFilters = useMemo(
    () =>
      normalizeFilters(applied, {
        skillIds: skillStatus === "ready" ? skillIds : null,
      }),
    [applied, skillIds, skillStatus],
  );

  useEffect(() => {
    appliedRef.current = appliedFilters;
  }, [appliedFilters]);

  const applyFilters = (nextFilters, source) => {
    window.clearTimeout(searchTimerRef.current);
    const normalized = normalizeFilters(nextFilters, {
      skillIds: skillStatus === "ready" ? skillIds : null,
    });
    appliedRef.current = normalized;
    setDraft(normalized);
    setApplied(normalized);
    startFetch(query, normalized, source);
  };

  const handleDraftChange = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const openSheet = () => {
    setDraft(appliedFilters);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setDraft(appliedFilters);
    setIsSheetOpen(false);
    filtersButtonRef.current?.focus();
  };

  const handleSheetApply = () => {
    applyFilters(draft, "apply");
    setIsSheetOpen(false);
    filtersButtonRef.current?.focus();
  };

  const handleSheetReset = () => {
    applyFilters(emptyFilters, "reset");
    setIsSheetOpen(false);
    filtersButtonRef.current?.focus();
  };

  const handleEmptyReset = () => {
    applyFilters(emptyFilters, "reset");
    resultsHeadingRef.current?.focus();
  };

  const handleRetry = () => startFetch(query, appliedFilters, "retry");

  const handleLoadMore = () => {
    if (isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);
    setLoadMoreError("");
    fetchResults(query, appliedFilters, "load-more", currentPage + 1, true);
  };

  const appliedCount = fields.filter(
    (field) => !field.disabled && appliedFilters[field.key],
  ).length;
  const selectedFilters = getSelectedFilters(appliedFilters, fields);
  const isLoading = status === "loading";
  const isError = status === "error";
  const isEmpty = status === "ready" && projects.length === 0;

  const availabilityParts = [];
  if (profile?.name) availabilityParts.push(profile.name);
  if (Array.isArray(profile?.skills) && profile.skills.length > 0) {
    availabilityParts.push(profile.skills.join(" + "));
  }
  if (
    profile?.availabilityHours !== null &&
    profile?.availabilityHours !== undefined
  ) {
    availabilityParts.push(`${profile.availabilityHours} h / week`);
  }
  if (
    profile?.durationWeeks !== null &&
    profile?.durationWeeks !== undefined
  ) {
    availabilityParts.push(`${profile.durationWeeks} weeks`);
  }
  const availabilitySummary = availabilityParts.join(" · ");

  let heading = "Project results";
  if (isLoading) {
    heading = "Loading Open projects...";
  } else if (isEmpty) {
    heading = "No results";
  } else if (status === "ready") {
    heading = `${projects.length} eligible Open ${projectWord(projects.length)}`;
  }

  // Short status line above the results on tablet and desktop.
  let regionSummary = "";
  if (isWide) {
    if (isLoading) {
      regionSummary =
        appliedCount > 0
          ? `${appliedCount} ${filterWord(appliedCount)} retained · eligibility still applies`
          : "Eligibility still applies";
    } else if (isEmpty) {
      regionSummary =
        appliedCount > 0
          ? `${appliedCount} optional ${filterWord(appliedCount)} applied`
          : "No optional filters applied";
    } else if (isError && appliedCount > 0) {
      regionSummary = selectedFilters.map((filter) => filter.text).join(" · ");
    }
  }

  // Labelled summary under the "Filters" button on mobile.
  const mobileSummary = selectedFilters
    .map((filter) => `${filter.label}: ${filter.text}`)
    .join(" · ");

  const errorMessage =
    appliedCount > 0
      ? `Connection error. Your search and ${countWord(appliedCount)} ${filterWord(appliedCount)} are retained.`
      : "Connection error. Your search is retained.";

  return (
    <div className={styles.page} ref={pageRef}>
      <h1 className={styles.heading}>Discover Projects</h1>
      <p className={styles.description}>
        Find a project that fits your skills and availability.
      </p>

      {!isEmpty && (
        <section className={styles.hero} aria-labelledby="discover-hero-title">
          <div className={styles.heroText}>
            <p className={styles.heroEyebrow}>Build together</p>
            <h2 className={styles.heroTitle} id="discover-hero-title">
              Find your team
            </h2>
            <p className={styles.heroCopy}>
              Browse open projects and join as a contributor.
            </p>
          </div>
          <img className={styles.heroImage} src={heroImage} alt="" />
        </section>
      )}

      {availabilitySummary && (
        <div className={styles.fullWidth}>
          <Alert variant="info" title="Your self-reported availability">
            {availabilitySummary}
          </Alert>
        </div>
      )}

      <div className={styles.fullWidth}>
        <Input
          label="Search projects"
          value={query}
          onChange={handleQueryChange}
          autoComplete="off"
        />
      </div>

      {!isWide && (
        <div className={styles.fullWidth}>
          <Button
            ref={filtersButtonRef}
            variant="secondary"
            fullWidth
            aria-haspopup="dialog"
            aria-expanded={isSheetOpen}
            onClick={openSheet}
          >
            {appliedCount > 0 ? `Filters · ${appliedCount} applied` : "Filters"}
          </Button>
          {mobileSummary && <p className={styles.summary}>{mobileSummary}</p>}
        </div>
      )}

      <div className={isWide ? styles.columns : styles.stack}>
        {isWide && (
          <FilterPanel
            values={draft}
            onChange={handleDraftChange}
            onApply={() => applyFilters(draft, "apply")}
            onReset={() => applyFilters(emptyFilters, "reset")}
            fields={fields}
            skillStatus={skillStatus}
            onRetrySkills={retrySkills}
          />
        )}

        <section className={styles.results} aria-busy={isLoading}>
          <p className={styles.srOnly} role="status">
            {announcement}
          </p>

          <h2
            className={hasNotice ? styles.srOnly : styles.resultsHeading}
            tabIndex={-1}
            ref={resultsHeadingRef}
          >
            {heading}
          </h2>

          {regionSummary && <p className={styles.summary}>{regionSummary}</p>}

          {hasNotice && (
            <Alert variant="success" title="Results updated">
              {`${eligibleProjects(total)}. Review role details before requesting.`}
            </Alert>
          )}

          {isLoading && (
            <>
              <ul className={styles.cards} aria-hidden="true">
                {Array.from({ length: 2 }, (_, index) => (
                  <li className={styles.skeleton} key={index}>
                    <span className={styles.barLong} />
                    <span className={styles.barShort} />
                    <span className={styles.barBlock} />
                  </li>
                ))}
              </ul>
              <p className={styles.loadingRow} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                Loading results...
              </p>
            </>
          )}

          {isError && (
            <div>
              <Alert variant="error" title="Projects could not load">
                {errorMessage}
              </Alert>
              <Button fullWidth onClick={handleRetry}>
                Retry results
              </Button>
            </div>
          )}

          {status === "ready" && projects.length > 0 && (
            <ul className={styles.cards}>
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectResultCard project={project} />
                </li>
              ))}
            </ul>
          )}

          {status === "ready" &&
            projects.length > 0 &&
            currentPage < totalPages && (
              <div className={styles.fullWidth}>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={isLoadingMore}
                  onClick={handleLoadMore}
                >
                  {isLoadingMore ? "Loading…" : "Load more"}
                </Button>
                {loadMoreError && (
                  <Alert variant="error">{loadMoreError}</Alert>
                )}
              </div>
            )}

          {isEmpty && (
            <div className={styles.emptyPanel}>
              <img
                className={styles.emptyIcon}
                src={listFilterIcon}
                alt=""
                aria-hidden="true"
              />
              <h3 className={styles.emptyTitle}>
                {isWide
                  ? "No eligible Open projects"
                  : "No Open projects fit these filters"}
              </h3>
              <p className={styles.emptyText}>Adjust optional filters.</p>
              <Button onClick={handleEmptyReset}>Reset filters</Button>
            </div>
          )}
        </section>
      </div>

      {!isWide && isSheetOpen && (
        <FilterSheet
          values={draft}
          onChange={handleDraftChange}
          onApply={handleSheetApply}
          onReset={handleSheetReset}
          onClose={closeSheet}
          fields={fields}
          skillStatus={skillStatus}
          onRetrySkills={retrySkills}
        />
      )}
    </div>
  );
}

export default DiscoverProjects;