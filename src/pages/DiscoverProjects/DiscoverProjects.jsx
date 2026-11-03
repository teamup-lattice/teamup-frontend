import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import listFilterIcon from "../../assets/list-filter.svg";
import heroImage from "../../assets/landing-cta.png";
import {
  availabilityProfile,
  emptyFilters,
  filterFields,
} from "../../data/discoverData";
import { getOpenProjects } from "../../services/discoverService";
import FilterPanel from "./FilterPanel";
import FilterSheet from "./FilterSheet";
import ProjectResultCard from "./ProjectResultCard";
import useIsWide from "./useIsWide";
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

const availabilitySummary = `${availabilityProfile.name} · ${availabilityProfile.role} · ${availabilityProfile.skills.join(" + ")} · ${availabilityProfile.hoursPerWeek} h / week for ${availabilityProfile.weeks} weeks. Results must meet required skills, hours and duration.`;

function getSelectedFilters(filters) {
  return filterFields
    .filter((field) => filters[field.key])
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

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [hasNotice, setHasNotice] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchResults = useCallback((nextQuery, nextFilters, source) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    getOpenProjects({
      query: nextQuery,
      filters: nextFilters,
      isRetry: source === "retry",
    })
      .then(({ projects: results }) => {
        // Ignore answers to older requests (for example while typing).
        if (requestId !== requestRef.current) return;

        const count = results.length;
        const isUserUpdate = source !== "initial" && source !== "search";
        const showNotice = isUserUpdate && count > 0;

        setProjects(results);
        setStatus("ready");
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
        if (requestId === requestRef.current) setStatus("error");
      });
  }, []);

  useEffect(() => {
    fetchResults("", emptyFilters, "initial");
  }, [fetchResults]);

  const startFetch = (nextQuery, nextFilters, source) => {
    setStatus("loading");
    setHasNotice(false);
    fetchResults(nextQuery, nextFilters, source);
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

  const applyFilters = (nextFilters, source) => {
    window.clearTimeout(searchTimerRef.current);
    appliedRef.current = nextFilters;
    setDraft(nextFilters);
    setApplied(nextFilters);
    startFetch(query, nextFilters, source);
  };

  const handleDraftChange = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const openSheet = () => {
    setDraft(applied);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setDraft(applied);
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

  const handleRetry = () => startFetch(query, applied, "retry");

  const appliedCount = Object.values(applied).filter(Boolean).length;
  const selectedFilters = getSelectedFilters(applied);
  const isLoading = status === "loading";
  const isError = status === "error";
  const isEmpty = status === "ready" && projects.length === 0;

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

      <div className={styles.fullWidth}>
        <Alert variant="info" title="Your self-reported availability">
          {availabilitySummary}
        </Alert>
      </div>

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
              {`${eligibleProjects(projects.length)}. Review role details before requesting.`}
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
              <p className={styles.emptyText}>
                Adjust optional filters. Required skills, hours and duration
                still apply.
              </p>
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
        />
      )}
    </div>
  );
}

export default DiscoverProjects;