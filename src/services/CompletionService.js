import completionData from "../data/CompletionData";

// TODO: replace each mock with a real api call once the backend has the
// completion endpoints. Until then every call waits, then succeeds or fails.
//
// Preview states (dev only, via the page URL):
//   ?simulate=missing       no saved outcome or deliverable
//   ?simulate=eligible      all 3 confirmations saved, ready to complete
//   ?simulate=completed     project already Completed
//   ?simulate=fail          saving the final evidence fails
//   ?simulate=loadfail      the page fails to load
//   ?simulate=failcomplete  eligible, and completing fails
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function confirmAll(confirmations) {
  return confirmations.map((item) => ({
    ...item,
    confirmedBy: item.confirmedBy ?? item.awaiting,
    confirmedOn: item.confirmedOn ?? "2026-11-30",
    awaiting: null,
  }));
}

function buildVariant(variant) {
  // Deep copy so the shared mock is never mutated by the screen.
  const data = JSON.parse(JSON.stringify(completionData));

  if (variant === "missing") {
    data.evidence = { outcome: "", deliverable: null };
  }
  if (variant === "eligible" || variant === "failcomplete") {
    data.confirmations = confirmAll(data.confirmations);
  }
  if (variant === "completed") {
    data.project.status = "Completed";
    data.confirmations = confirmAll(data.confirmations);
  }
  return data;
}

export async function getCompletion(projectId, { variant = null } = {}) {
  void projectId;
  await wait(600);
  if (variant === "loadfail") throw new Error("Request failed");
  return buildVariant(variant);
}

// evidence: { outcome, deliverable: { kind: "file" | "link", label, name } | null }
// A real upload will also need the File object (deliverable.file).
export async function saveCompletionEvidence(
  projectId,
  evidence,
  { simulateFail = false } = {},
) {
  void projectId;
  await wait(1200);
  if (simulateFail) throw new Error("Request failed");
  return {
    outcome: evidence.outcome,
    deliverable: evidence.deliverable
      ? {
          kind: evidence.deliverable.kind,
          label: evidence.deliverable.label,
          name: evidence.deliverable.name,
        }
      : null,
  };
}

export async function completeProject(projectId, { simulateFail = false } = {}) {
  void projectId;
  await wait(1200);
  if (simulateFail) throw new Error("Request failed");
  return { status: "Completed", visibility: "PRIVATE", audience: "Team-only" };
}
