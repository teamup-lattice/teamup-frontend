import { availabilityProfile, openProjects } from "../data/discoverData";

// Eligibility always applies: the project's required skills, weekly hours and
// duration must fit the user's self-reported availability.
function isEligible(project) {
  return (
    project.skills.every((skill) => availabilityProfile.skills.includes(skill)) &&
    project.hoursPerWeek <= availabilityProfile.hoursPerWeek &&
    project.weeks <= availabilityProfile.weeks
  );
}

function matchesFilters(project, filters) {
  return (
    (!filters.skill || project.skills.includes(filters.skill)) &&
    (!filters.role || project.role === filters.role) &&
    (!filters.type || project.type === filters.type) &&
    (!filters.duration || String(project.weeks) === filters.duration) &&
    (!filters.hours || String(project.hoursPerWeek) === filters.hours)
  );
}

function matchesQuery(project, query) {
  const text = query.trim().toLowerCase();

  return (
    !text ||
    project.title.toLowerCase().includes(text) ||
    project.description.toLowerCase().includes(text)
  );
}

// Mock service, same pattern as profileService and projectService.
// Add ?load=fail to the page URL to see the network-error state.
// "Retry results" then succeeds, so you can also see the "Results updated" message.
export function getOpenProjects({ query = "", filters = {}, isRetry = false } = {}) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const shouldFail =
        !isRetry &&
        new URLSearchParams(window.location.search).get("load") === "fail";

      if (shouldFail) {
        reject(new Error("Mock open projects load failed."));
        return;
      }

      resolve({
        projects: openProjects.filter(
          (project) =>
            isEligible(project) &&
            matchesFilters(project, filters) &&
            matchesQuery(project, query),
        ),
      });
    }, 600);
  });
}