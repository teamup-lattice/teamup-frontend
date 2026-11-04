import {
  availabilityProfile,
  projectDetailsById,
} from "../data/projectDetailsData";

// A role is available to the user when its skills, weekly hours and duration
// fit the self-reported availability from their profile.
function getEligibility(role) {
  const missingSkills = role.skills.filter(
    (skill) => !availabilityProfile.skills.includes(skill),
  );
  const exceedsHours = role.hoursPerWeek > availabilityProfile.hoursPerWeek;
  const exceedsWeeks = role.weeks > availabilityProfile.weeks;

  return {
    isEligible: !exceedsHours && !exceedsWeeks && missingSkills.length === 0,
    exceedsHours,
    exceedsWeeks,
    missingSkills,
  };
}

// Mock service, same pattern as profileService and projectService.
// Add ?load=fail to the page URL to see the "terms could not load" state
// ("Recheck current project" then succeeds).
// Add ?role=closed to see the "role no longer open" state.
export function getProjectDetails({ id, roleId, isRetry = false } = {}) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      if (!isRetry && params.get("load") === "fail") {
        reject(new Error("Mock project terms load failed."));
        return;
      }

      const project = projectDetailsById[id];

      if (!project) {
        const error = new Error("Project not found.");
        error.code = "not_found";
        reject(error);
        return;
      }

      const roles = project.roles.map((role) => ({
        ...role,
        eligibility: getEligibility(role),
      }));
      const selectedRole =
        roles.find((role) => role.id === roleId) ??
        roles.find((role) => role.eligibility.isEligible) ??
        roles[0];

      resolve({
        project,
        roles,
        profile: availabilityProfile,
        selectedRoleId: selectedRole.id,
        isRoleClosed:
          params.get("role") === "closed" && selectedRole.id === "ui-ux-designer",
      });
    }, 700);
  });
}