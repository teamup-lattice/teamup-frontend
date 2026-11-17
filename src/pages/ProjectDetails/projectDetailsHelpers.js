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

export const ownerLine = (owner) => `${owner.name} · Owner`;

export const skillNames = (skills = []) =>
  skills
    .map((entry) => entry?.skill?.name ?? entry?.name)
    .filter(Boolean);