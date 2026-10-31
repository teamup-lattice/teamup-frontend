import { useCallback, useEffect, useRef, useState } from "react";

function useSimulatedAction() {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  const run = useCallback(({ ignoreFailure = false } = {}) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }

    setStatus("saving");
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const shouldFail =
        new URLSearchParams(window.location.search).get("fail") === "1";
      setStatus(shouldFail && !ignoreFailure ? "failed" : "done");
    }, 1500);
  }, []);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    },
    [],
  );

  return { status, run };
}

export default useSimulatedAction;
