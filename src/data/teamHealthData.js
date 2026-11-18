const teamHealthData = {
  statusLevels: [
    { status: "ON_TRACK", label: "✓ On track", tone: "onTrack" },
    {
      status: "NEEDS_ATTENTION",
      label: "! Needs attention",
      tone: "needsAttention",
    },
    { status: "AT_RISK", label: "△ At risk", tone: "atRisk" },
  ],
  health: {
    title: "Team health",
    description: "A shared team view, not an assessment of individual members.",
    helper: "Team status levels · No individual scores or rankings",
    unavailable: "Status unavailable",
  },
  sharedProgress: {
    title: "Shared progress",
    teammatesLabel: "Accepted teammates",
  },
  ownerPrompt: {
    eyebrow: "OWNER ONLY · INACTIVITY PROMPT",
    title: "Inactive teammates",
    descriptionInactive:
      "These teammates have been inactive for a while. They may need support or a different commitment.",
    descriptionWithDays: "These teammates have been inactive for more than {days} days. They may need support or a different commitment.",
    releaseLabel: "Review release",
    helper: "Release needs your confirmation and opens the release review.",
  },
  checkIn: {
    eyebrow: "WEEKLY CHECK-IN",
    title: "How is the team doing?",
    description:
      "Share what moved forward, what's next and where support would help.",
    openUpdates: "Open team Updates",
    textareaLabel: "Your update",
    post: "Post update",
    posting: "Posting update...",
    emptyTitle: "No updates yet",
    emptyText: "Start with a short update. There's no perfect answer.",
    emptyButton: "Write an update",
    postedTitle: "Update posted",
    postedMessage: "Your update is now in the team Updates thread.",
    errorTitle: "Update did not post",
  },
  updates: {
    title: "Updates · Team thread",
  },
  loading: {
    title: "Loading team health…",
    description: "We'll show the status when it's available.",
    helper: "Loading check-ins and activity prompts…",
  },
  error: {
    title: "Team health couldn't load",
    message: "Status unavailable. No roles or project status changed.",
  },
  notFound: {
    title: "Team health unavailable",
    message:
      "You may not be a team member on this project, or the project wasn't found.",
  },
};

export default teamHealthData;
