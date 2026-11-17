import completionData from "../data/CompletionData";

// Preview states (dev only, via the page URL):
//   ?simulate=eligible      all 3 confirmations saved, ready to complete
//   ?simulate=loadfail      the mock confirmations fail to load
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

  if (variant === "eligible") {
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
