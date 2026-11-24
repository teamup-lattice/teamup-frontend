import { useEffect, useState } from "react";
import { getContribution } from "../../../services/contributionsService";

// Loads one member's contribution for the Contribution summary and Teammate
// confirmation screens. `input` must be memoised by the screen (or null while
// the workspace is still loading). Loading is derived from the request key, so
// there is no state set synchronously inside the effect.
export function useContribution({ projectId, input, variant }) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${projectId}|${variant}|${attempt}|${input ? "ready" : "wait"}`;
  const [loaded, setLoaded] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    if (!input) return undefined;
    let isCurrent = true;
    getContribution(projectId, input, { variant })
      .then((data) => {
        if (isCurrent) setLoaded({ key: requestKey, data, error: "" });
      })
      .catch((error) => {
        console.error("Failed to load contribution:", error);
        if (isCurrent) {
          setLoaded({
            key: requestKey,
            data: null,
            error: error.message || "Something went wrong. Try again.",
          });
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [projectId, input, variant, requestKey]);

  const isLoading = loaded.key !== requestKey;

  return {
    isLoading,
    data: isLoading ? null : loaded.data,
    error: isLoading ? "" : loaded.error,
    retry: () => setAttempt((count) => count + 1),
    // Merge saved values into the loaded record after a successful save.
    update: (patch) =>
      setLoaded((current) => ({ ...current, data: { ...current.data, ...patch } })),
  };
}
