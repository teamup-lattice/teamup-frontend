import { VISIBILITY_FIELDS } from "../../data/profileData";

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];

function listText(items) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function split(values) {
  return {
    on: VISIBILITY_FIELDS.filter((f) => values[f.key]).map((f) => f.short),
    off: VISIBILITY_FIELDS.filter((f) => !values[f.key]).map((f) => f.short),
  };
}

export function hasAnyPublic(values) {
  return split(values).on.length > 0;
}

export function savedSummary(values) {
  const { on } = split(values);
  const n = on.length;
  if (n === 0) return "Saved choices: all profile fields private.";
  if (n === VISIBILITY_FIELDS.length) return "Saved choices: all profile fields public.";
  return `Saved: ${WORDS[n]} selected ${n === 1 ? "field" : "fields"} public. Other fields private.`;
}

export function draftSummary(draft, saved) {
  const drafted = split(draft).on;
  const savedOn = split(saved).on;
  const draftText = drafted.length
    ? `Local draft: ${listText(drafted)} selected.`
    : "Local draft: no fields selected.";
  let savedText = "Saved: all fields private.";
  if (savedOn.length === VISIBILITY_FIELDS.length) savedText = "Saved: all fields public.";
  else if (savedOn.length > 0) savedText = `Saved: ${listText(savedOn)} public.`;
  return `${draftText} ${savedText}`;
}

export function successMessage(values) {
  const { on, off } = split(values);
  if (on.length === 0) return "No profile fields are public. Visitors see that your profile is private.";
  if (off.length === 0) return "All profile fields are public.";
  return `${capitalize(listText(on))} ${on.length > 1 ? "are" : "is"} public. ${capitalize(listText(off))} ${off.length > 1 ? "remain" : "remains"} private.`;
}

export function errorMessage(saved) {
  const visitors = hasAnyPublic(saved)
    ? "Visitors still see your last saved choices."
    : "Visitors still see no profile fields.";
  return `Save failed. Your selections are retained for retry. ${visitors}`;
}

export function hasChanges(a, b) {
  return (
    a.showProject !== b.showProject ||
    VISIBILITY_FIELDS.some((f) => a[f.key] !== b[f.key])
  );
}
