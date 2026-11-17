import { useCallback, useEffect, useRef, useState } from "react";
import { getSkills } from "../../services/profileService";

function readSkills(response) {
  const list = Array.isArray(response)
    ? response
    : Array.isArray(response?.skills)
      ? response.skills
      : [];

  const byId = new Map();

  for (const skill of list) {
    if (!skill || skill.id === undefined || skill.id === null) continue;

    const name = typeof skill.name === "string" ? skill.name.trim() : "";
    if (!name) continue;

    const value = String(skill.id);
    if (!byId.has(value)) {
      byId.set(value, { value, label: name });
    }
  }

  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function useSkillsCatalog() {
  const [state, setState] = useState({ status: "loading", options: [] });
  const [attempt, setAttempt] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    let isMounted = true;

    getSkills()
      .then((response) => {
        if (!isMounted || requestId !== requestRef.current) return;

        const options = readSkills(response);
        if (options.length === 0) {
          setState({ status: "error", options: [] });
          return;
        }

        setState({ status: "ready", options });
      })
      .catch(() => {
        if (!isMounted || requestId !== requestRef.current) return;
        setState({ status: "error", options: [] });
      });

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", options: [] });
    setAttempt((current) => current + 1);
  }, []);

  return { status: state.status, options: state.options, retry };
}

export default useSkillsCatalog;
