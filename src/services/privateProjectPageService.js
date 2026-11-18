import privateProjectPageData from "../data/privateProjectPageData";
import {
  getSharingPrivacy,
  saveProfileDisplay,
} from "./sharingPrivacyService";

// TODO: replace the mock with the real endpoint (for example
// api.get(`/api/projects/${projectId}/page`)) once the backend has it.
//
// Preview states (dev only, via the page URL):
//   ?simulate=fail          the page fails to load
//   ?simulate=notcompleted  the project is not Completed yet
//   ?simulate=profilefail   "Save own profile choice" fails
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPrivateProjectPage(projectId, { variant = null } = {}) {
  void projectId;
  await wait(600);
  if (variant === "fail") throw new Error("Request failed");

  const data = JSON.parse(JSON.stringify(privateProjectPageData));
  if (variant === "notcompleted") data.project.status = "In Progress";

  // Team-page sharing and the profile choice are owned by the Sharing and
  // privacy screen, so read them from there to keep both screens in step.
  const sharing = await getSharingPrivacy(projectId);
  return {
    ...data,
    sharing: {
      savedVisibility: sharing.isShared ? "Shared" : "Team-only",
      displayOnProfile: sharing.profile.displayOnProfile,
    },
  };
}

export function saveOwnProfileChoice(displayOnProfile, { simulateFail = false } = {}) {
  if (simulateFail) {
    return wait(800).then(() => {
      throw new Error("Request failed");
    });
  }
  return saveProfileDisplay(displayOnProfile);
}
