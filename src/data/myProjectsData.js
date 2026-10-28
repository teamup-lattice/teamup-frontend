// Mock records for the My Projects screen (same style as dashboardData.js).
// Replace with the backend response when the endpoint shape is confirmed.
const myProjectsData = [
  {
    id: "campus-book-exchange",
    title: "Campus book exchange",
    description: "Help students exchange course books on campus.",
    status: "Draft",
    details: ["Owner", "Project setup not yet published"],
    note: "Your draft is private until you publish.",
  },
  {
    id: "student-study-planner",
    title: "Student study planner",
    description: "Build a simple tool for planning study sessions.",
    status: "Open",
    details: ["Recruiting a Designer", "UI design", "6 hours/week", "4 weeks"],
    note: "Review the role and commitment before requesting to join.",
  },
  {
    id: "library-finder",
    title: "Library finder",
    description: "Find nearby campus libraries and useful study spaces.",
    status: "Team Formed",
    details: ["Member", "Frontend Developer", "Team not started"],
    note: "Joined · Awaiting project start",
  },
  {
    id: "campus-marketplace",
    title: "Campus Marketplace",
    description: "Build a place for students to list and find campus items.",
    status: "In Progress",
    attention: {
      badge: "Team health: Needs attention",
      detail: "1 task overdue · Review together",
    },
    details: ["In Progress", "Owner", "Product Manager", "19 Oct–30 Nov 2026"],
    note: "12 Nov · 2 of 6 tasks Done",
  },
  {
    id: "peer-resource-directory",
    title: "Peer resource directory",
    description: "A shared directory of learning resources for students.",
    status: "Completed",
    details: ["Member", "Completed project", "Individual contribution available"],
    note: "Private on your profile. Team page sharing is independent.",
  },
  {
    id: "campus-events-prototype",
    title: "Campus events prototype",
    description: "A prototype for browsing small campus events.",
    status: "Ended Early",
    details: ["Member", "Ended Early", "Contribution records retained"],
    note: "Not Completed. Existing work remains available for review.",
  },
];

export default myProjectsData;