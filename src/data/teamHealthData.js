const teamHealthData = {
  statusLevels: [
    { label: "✓ On track", tone: "onTrack" },
    { label: "! Needs attention", tone: "needsAttention" },
    { label: "△ At risk", tone: "atRisk" },
  ],
  overviewSummary: {
    taskCount: "2 of 6 tasks Done · 1 overdue",
    status: "Project remains In Progress.",
    teammates: "Ada, David and John · Accepted teammates",
  },
  ownerPrompt: {
    eyebrow: "OWNER ONLY · INACTIVITY PROMPT",
    title: "A gentle check-in with John",
    description:
      "John has had no activity for 5 days. They may need support or a different commitment.",
    helper: "Following up does not release a role. Release needs your confirmation.",
  },
  weeklyCheckIn: {
    eyebrow: "WEEKLY CHECK-IN · 9–15 NOV",
    title: "How is the team doing?",
    description:
      "Share what moved forward, what's next and where support would help.",
    updates: [
      { author: "David", date: "12 Nov", message: "Waiting for agreed sign-up fields." },
      { author: "Ada", date: "12 Nov", message: "I'll help agree the fields today." },
    ],
    postedText:
      "We agreed the requirements. Next, I'll help unblock sign-up fields. Could we review them together?",
    textareaLabel: "Your weekly check-in",
    helperText:
      "Posts to Campus Marketplace → Updates. Visible to your accepted team.",
  },
  followUp: {
    eyebrow: "OWNER FOLLOW-UP · NOT A ROLE RELEASE",
    title: "Check in with John",
    description:
      "No activity for 5 days. Ask what would help, without making assumptions.",
    textareaLabel: "Message in team Updates",
    message:
      "@John, how are things going? Is there anything we can help with, or would a different commitment work better?",
    helperText: "Visible in the team Updates thread. John's role stays unchanged.",
    footer: "2 of 6 tasks Done · 1 overdue · Contribution history retained",
  },
  release: {
    eyebrow: "OWNER CONFIRMATION · ADA",
    title: "Release John's role?",
    paragraphs: [
      "John has had no activity for 5 days. You can follow up first if you're unsure.",
      "Confirming releases John from this role and makes it available. Their contribution history is preserved. Campus Marketplace stays In Progress.",
      "Nothing changes until you confirm.",
    ],
    footer: "2 of 6 tasks Done · 1 overdue · Contribution history retained",
  },
  releaseFailed: {
    title: "Role wasn't released",
    message:
      "John keeps the role. No membership or task status changed. You can try again.",
  },
  releaseReleased: {
    title: "John's role released",
    message:
      "Confirmed by Ada, Owner. Contribution history is preserved.",
    description:
      "The role is now available. Campus Marketplace remains In Progress; saved tasks are unchanged.",
    footer: "2 of 6 tasks Done · 1 overdue · Contribution history retained",
  },
  checkInPosted: {
    title: "Check-in posted",
    message: "Your update is now in the team Updates thread.",
    label: "Ada · 12 Nov · Weekly check-in",
  },
  noCheckIns: {
    title: "No check-ins yet",
    text: "Start with a short update. There's no perfect answer.",
    button: "Write a check-in",
  },
  loading: {
    title: "Loading team health…",
    description: "We'll show the status when it's available.",
    helper: "Loading check-ins and activity prompts…",
  },
  error: {
    title: "Team health couldn't load",
    message: "Status unavailable. No roles or project status changed.",
    updatesTitle: "Updates is still available",
    updatesText:
      "You can open the team thread while we try again. We won't assume a health status.",
  },
  empty: {
    teamHealth: "Status unavailable",
  },
};

export default teamHealthData;
