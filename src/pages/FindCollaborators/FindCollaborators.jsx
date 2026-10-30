import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import AvatarRow from "../../components/AvatarRow";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Skeleton from "../../components/Skeleton";
import { formatDate } from "../CreateProject/formatDate";
import { people, project, roles } from "../../data/collaborationData";
import styles from "./FindCollaborators.module.css";

const role = roles.uiux;
const person = people.david;
const roleOptions = Object.entries(roles).map(([value, item]) => ({
  value,
  label: item.title,
}));
const projectOption = [{ value: "campus", label: `${project.name} · Open` }];
const skillOptions = [...new Set([...project.skills, ...role.requiredSkills])].map(
  (skill) => ({ value: skill, label: skill }),
);
const durationOptions = [...new Set(Object.values(roles).map((item) => item.weeks))].map(
  (weeks) => ({ value: String(weeks), label: `${weeks} weeks` }),
);
const hoursOptions = [...new Set(Object.values(roles).map((item) => item.hours))].map(
  (hours) => ({ value: String(hours), label: `${hours} h / week` }),
);
const defaultFilters = {
  skill: "UI design",
  role: "uiux",
  projectType: project.type,
  duration: String(role.weeks),
  hours: String(role.hours),
};
const emptyFilters = {
  skill: "",
  role: "",
  projectType: "",
  duration: "",
  hours: "",
};
const supportedStates = [
  "default",
  "incomplete",
  "loading",
  "zero",
  "notsent",
  "sent",
  "race",
];

function OptionalFilters({ values, onChange, onReset }) {
  const setValue = (key) => (event) => {
    onChange({ ...values, [key]: event.target.value });
  };

  return (
    <section className={styles.filterCard}>
      <h2 className={styles.cardTitle}>Optional filters</h2>
      <div className={styles.filterFields}>
        <Select
          label="Skill"
          options={skillOptions}
          value={values.skill}
          onChange={setValue("skill")}
          placeholder=""
        />
        <Select
          label="Role"
          options={roleOptions}
          value={values.role}
          onChange={setValue("role")}
          placeholder=""
        />
        <Select
          label="Project type"
          options={[{ value: project.type, label: project.type }]}
          value={values.projectType}
          onChange={setValue("projectType")}
          placeholder=""
        />
        <Select
          label="Duration"
          options={durationOptions}
          value={values.duration}
          onChange={setValue("duration")}
          placeholder=""
        />
        <Select
          label="Weekly hours"
          options={hoursOptions}
          value={values.hours}
          onChange={setValue("hours")}
          placeholder=""
        />
      </div>
      <button className={styles.textLink} type="button" onClick={onReset}>
        Reset optional filters
      </button>
      <p className={styles.helper}>
        Reset never removes the selected role&apos;s required skills, hours and
        duration.
      </p>
    </section>
  );
}

function FindCollaborators() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryState = searchParams.get("state");
  const state = supportedStates.includes(queryState) ? queryState : "default";
  const [isReviewing, setIsReviewing] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [search, setSearch] = useState(person.name);
  const [incompleteProject, setIncompleteProject] = useState("");
  const [incompleteRole, setIncompleteRole] = useState("");

  const filterCount = Object.values(filters).filter(Boolean).length;
  const filterSummary = [
    filters.skill && `Skill: ${filters.skill}`,
    filters.role && `Role: ${roles[filters.role]?.title}`,
    filters.projectType && `Type: ${filters.projectType}`,
    filters.duration && `Duration: ${filters.duration} weeks`,
    filters.hours && `Weekly hours: ${filters.hours} h / week`,
  ].filter(Boolean);

  const pageTitle =
    state === "loading"
      ? "Campus Marketplace · Designer"
      : state === "notsent"
        ? "Invitation to David"
        : state === "sent"
          ? "Invitation record"
          : "Find Collaborators";

  const resetFilters = () => setDraftFilters(emptyFilters);
  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterSheetOpen(false);
  };
  const closeFilterSheet = () => {
    setDraftFilters(filters);
    setIsFilterSheetOpen(false);
  };
  const setPreviewState = (nextState) => {
    setIsReviewing(false);
    setSearchParams({ state: nextState });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>{pageTitle}</h1>
        {state === "default" && (
          <p className={styles.subtitle}>
            Choose an owned Open project and a specific open role.
          </p>
        )}
        {state === "loading" && (
          <p className={styles.subtitle}>
            UI design + Prototyping · 6 h / week · 6 weeks
          </p>
        )}
      </header>

      {state === "default" && (
        <>
          <Alert variant="info" title="Required for this role">
            {role.requiredSkills.join(" + ")} · {role.hours} h / week ·{" "}
            {role.weeks} weeks, {formatDate(project.startDate)}–
            {formatDate(project.endDate)}. People who do not meet all required
            skills, hours and duration are excluded.
          </Alert>
          <main className={styles.content}>
            <div className={styles.selectionFields}>
              <Select
                label="Owned project"
                options={projectOption}
                value="campus"
                onChange={() => {}}
              />
              <Select
                label="Open role"
                options={roleOptions}
                value="uiux"
                onChange={() => {}}
              />
            </div>
            <Input
              label="Search people"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className={styles.desktopFilters}>
              <OptionalFilters
                values={draftFilters}
                onChange={setDraftFilters}
                onReset={resetFilters}
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
                      onClick={closeFilterSheet}
                    >
                      Close
                    </button>
                  </div>
                  <p className={styles.body}>
                    {project.name} · {role.title}
                  </p>
                  <p className={styles.helper}>
                    Apply to update results. Close to discard filter changes.
                  </p>
                  <OptionalFilters
                    values={draftFilters}
                    onChange={setDraftFilters}
                    onReset={resetFilters}
                  />
                  <Alert variant="info" title="Role eligibility stays on">
                    UI design + Prototyping · 6 h / week · 6 weeks remain
                    required after reset.
                  </Alert>
                  <Button fullWidth onClick={applyFilters}>
                    Apply changes
                  </Button>
                </section>
              </div>
            )}
            <section className={styles.results}>
              <h2 className={styles.sectionHeading}>1 eligible collaborator</h2>
              <article className={styles.card}>
                <h3 className={styles.cardTitle}>Public profile preview</h3>
                <AvatarRow initial="D" text={`${person.name} · ${role.title}`} />
                <p className={styles.helper}>
                  Self-reported skills and availability
                </p>
                <p className={styles.body}>{person.skills.join(" · ")}</p>
                <p className={styles.emphasis}>
                  {person.level} · {person.hours} h / week · {person.weeks} weeks
                </p>
                <div>
                  <p className={styles.label}>Goal</p>
                  <p className={styles.body}>{person.goal}</p>
                </div>
                <p className={styles.helper}>
                  Public fields only. Contact details hidden, including from the
                  Owner.
                </p>
                <Button fullWidth onClick={() => setIsReviewing(true)}>
                  Review invitation to David
                </Button>
              </article>
              {isReviewing && (
                <article className={styles.card}>
                  <h3 className={styles.cardTitle}>Review invitation</h3>
                  <p className={styles.emphasis}>
                    Invite David to Campus Marketplace
                  </p>
                  <p className={styles.body}>
                    {role.title} · {role.hours} h / week · {role.weeks} weeks
                  </p>
                  <p className={styles.body}>{role.responsibilities}</p>
                  <p className={styles.body}>
                    {formatDate(project.startDate)}–{formatDate(project.endDate)}{" "}
                    · {role.availability}
                  </p>
                  <p className={styles.body}>
                    Sending is not joining. David must review and save his
                    commitment acceptance.
                  </p>
                  <Button fullWidth onClick={() => setPreviewState("sent")}>
                    Send invitation to David
                  </Button>
                  <AltLink to="/find-collaborators">
                    <span
                      className={styles.cancelLink}
                      onClick={() => setIsReviewing(false)}
                    >
                      Cancel invitation review
                    </span>
                  </AltLink>
                </article>
              )}
            </section>
          </main>
        </>
      )}

      {state === "incomplete" && (
        <main className={styles.content}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Choose the work first</h2>
            <Select
              label="Owned Open project"
              options={projectOption}
              placeholder="Choose project"
              value={incompleteProject}
              onChange={(event) => setIncompleteProject(event.target.value)}
            />
            <Select
              label="Open role"
              options={roleOptions}
              placeholder="Choose role"
              value={incompleteRole}
              onChange={(event) => setIncompleteRole(event.target.value)}
            />
            <p className={styles.body}>
              Select both to search eligible people.
            </p>
            <Button
              fullWidth
              disabled={!incompleteProject || !incompleteRole}
              onClick={() => setPreviewState("default")}
            >
              Find people
            </Button>
          </section>
          <EmptyState
            title="No owned Open project?"
            text="Create a project and define its roles before inviting collaborators."
          >
            <Button fullWidth onClick={() => navigate("/projects/new")}>
              Create project
            </Button>
          </EmptyState>
        </main>
      )}

      {state === "loading" && (
        <main className={styles.content}>
          <div className={styles.skeletons}>
            <Skeleton />
            <Skeleton />
          </div>
          <div className={styles.loadingBar} role="status">
            <span className={styles.spinner} aria-hidden="true" />
            Loading eligible people…
          </div>
        </main>
      )}

      {state === "zero" && (
        <>
          <main className={styles.content}>
            <div className={styles.selectionFields}>
              <Select
                label="Owned project"
                options={projectOption}
                value="campus"
                onChange={() => {}}
              />
              <Select
                label="Open role"
                options={roleOptions}
                value="uiux"
                onChange={() => {}}
              />
            </div>
            <EmptyState
              title="No eligible people found"
              text={
                <>
                  <span className={styles.zeroDesktopText}>
                    Adjust optional filters or return to your role definitions.
                    Required skills, weekly hours and duration remain enforced.
                  </span>
                  <span className={styles.zeroMobileText}>
                    Adjust optional filters or edit roles. UI design,
                    Prototyping, hours and duration still required.
                  </span>
                </>
              }
            >
              <Button fullWidth onClick={() => setFilters(emptyFilters)}>
                Reset optional filters
              </Button>
            </EmptyState>
            <Button variant="secondary" fullWidth>
              Return to role definitions
            </Button>
          </main>
        </>
      )}

      {state === "notsent" && (
        <main className={styles.content}>
          <Alert variant="error" title="Invitation could not send">
            Invitation failed. Project, role and David retained. Check
            invitation status and role before retrying. No membership created.
          </Alert>
          <AvatarRow initial="D" text="David · UI/UX Designer" />
          <p className={styles.body}>
            Campus Marketplace · 6 h / week · 6 weeks
          </p>
          <Button fullWidth>Recheck invitation status</Button>
          <AltLink to="/find-collaborators">Cancel review</AltLink>
        </main>
      )}

      {state === "sent" && (
        <main className={styles.content}>
          <Alert variant="success" title="Invitation sent to David">
            Pending response and saved commitment acceptance. David has not
            joined.
          </Alert>
          <AvatarRow initial="D" text="David · UI/UX Designer" />
          <p className={styles.body}>
            Campus Marketplace · 6 h / week · 6 weeks
          </p>
          <Button fullWidth>View sent invitation</Button>
        </main>
      )}

      {state === "race" && (
        <main className={styles.content}>
          <Alert variant="error" title="Invitation paused">
            Role or eligibility changed. Recheck the project, role and
            availability before sending.
          </Alert>
          <Button fullWidth>Recheck current role</Button>
          <Button fullWidth disabled>
            Send invitation
          </Button>
        </main>
      )}
    </div>
  );
}

export default FindCollaborators;
