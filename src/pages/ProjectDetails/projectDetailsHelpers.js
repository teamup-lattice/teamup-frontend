const COUNT_WORDS = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

export const countWord = (count) => COUNT_WORDS[count] ?? String(count);

export const capitalize = (text) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export function joinWithAnd(items) {
  if (items.length <= 2) return items.join(" and ");

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export const ownerLine = (owner) =>
  `${owner.name} · Owner / ${owner.role} · ${owner.hoursPerWeek} h / week`;

// Why the signed-in user cannot request this role.
export function unavailableMessage(role, profile) {
  const { exceedsHours, exceedsWeeks, missingSkills } = role.eligibility;
  const parts = [];

  if (exceedsHours) {
    parts.push(
      `Requires ${role.hoursPerWeek} h / week; your availability is ${profile.hoursPerWeek} h / week.`,
    );
  }

  if (exceedsWeeks) {
    parts.push(
      `Requires ${role.weeks} weeks; your availability is ${profile.weeks} weeks.`,
    );
  }

  if (missingSkills.length > 0) {
    parts.push(`${joinWithAnd(missingSkills)} also required.`);
  }

  parts.push("Choose another eligible role.");

  return parts.join(" ");
}