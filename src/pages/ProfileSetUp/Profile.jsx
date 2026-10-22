import { useState } from "react";
import "./profile.css";

const availableSkills = [
  "Planning",
  "Research",
  "Design",
  "Communication",
  "Development",
  "Other skill",
];

function Profile() { 
  const [formData, setFormData] = useState({
    name: "",
    role: "Product manager",
    skills: [],
    skillLevel: "Beginner",
    goals: "",
    timeCommitment: "Self-paced / flexible",
    workMode: "Remote",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSkillChange(event) {
    const { value, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      skills: checked
        ? [...previous.skills, value]
        : previous.skills.filter((skill) => skill !== value),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (formData.skills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }

    if (!formData.goals.trim()) {
      setError("Please enter your goals.");
      return;
    }

    setError("");

    // Temporary: inspect submitted data in the browser console.
    // Connect this to team's API or next-step flow later.
    console.log("Profile setup data:", formData);
    alert("Your profile form is valid!");
  }

  return (
    <div className="profile-setup">
      <header className="profile-header">
        <a className="brand" href="/">
          TeamUp
        </a>

        <nav className="account-links" aria-label="Account">
          <a href="/signup">Create account</a>
          <span>/</span>
          <a href="/login">Sign in</a>
        </nav>
      </header>

      <main className="profile-main">
        <div className="profile-intro">
          <p className="eyebrow">Required profile</p>
          <h1>Profile setup</h1>
        </div>

        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="profile-name">Name *</label>
            <input
              id="profile-name"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="profile-role">Role *</label>
            <select
              id="profile-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option>Product manager</option>
              <option>Frontend developer</option>
              <option>Backend developer</option>
              <option>UI/UX designer</option>
              <option>Data analyst</option>
              <option>Student</option>
              <option>Other</option>
            </select>
          </div>

          <fieldset className="skills-field">
            <legend>Skills — select multiple *</legend>

            <div className="skills-list">
              {availableSkills.map((skill) => (
                <label
                  className="skill-option"
                  key={skill}
                >
                  <input
                    type="checkbox"
                    value={skill}
                    checked={formData.skills.includes(skill)}
                    onChange={handleSkillChange}
                  />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-field">
            <label htmlFor="profile-level">Skill level *</label>
            <select
              id="profile-level"
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleChange}
              required
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="profile-goals">Goals *</label>
            <textarea
              id="profile-goals"
              name="goals"
              value={formData.goals}
              onChange={handleChange}
              placeholder="What do you want to achieve?"
              rows={3}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="profile-time">
              Time commitment *
            </label>
            <select
              id="profile-time"
              name="timeCommitment"
              value={formData.timeCommitment}
              onChange={handleChange}
              required
            >
              <option>Self-paced / flexible</option>
              <option>2–5 hours per week</option>
              <option>5–10 hours per week</option>
              <option>10+ hours per week</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="profile-work-mode">
              Preferred work mode *
            </label>
            <select
              id="profile-work-mode"
              name="workMode"
              value={formData.workMode}
              onChange={handleChange}
              required
            >
              <option>Remote</option>
              <option>Hybrid</option>
              <option>In person</option>
            </select>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="continue-button" type="submit">
            Continue
          </button>
        </form>
      </main>
    </div>
  );
}

export default Profile;

