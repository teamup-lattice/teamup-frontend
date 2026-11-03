import { useSearchParams } from "react-router-dom";

// Dev-only switch for reviewing states, e.g. ?simulate=fail
export function useSimulate() {
  const [params] = useSearchParams();
  return import.meta.env.DEV ? params.get("simulate") : null;
}
