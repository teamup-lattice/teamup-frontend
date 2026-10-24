import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import Input from "../../components/Input";
import Select from "../../components/Select";
import { getMyProfile } from "../../services/dashboardService";
import { saveProfile } from "../../services/profileService";
import styles from "./RequiredProfile.module.css";

const roles = [
  { value: "Product Manager", label: "Product Manager" },
  { value: "UI/UX Designer", label: "UI/UX Designer" },
  { value: "Frontend Developer", label: "Frontend Developer" },
  { value: "Backend Developer", label: "Backend Developer" },
];

const skills = [
  "Product planning",
  "User research",
  "Product coordination",
];

const skillLevels = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

const durations = [
  { value: "4 weeks", label: "4 weeks" },
  { value: "6 weeks", label: "6 weeks" },
  { value: "8 weeks", label: "8 weeks" },
];

const missingFieldDetails = [
  { field: "role", description: "your professional role" },
  { field: "skills", description: "at least one skill" },
  { field: "skillLevel", description: "your skill level" },
  { field: "goals", description: "your goals" },
  { field: "weeklyAvailability", description: "your weekly availability" },
  { field: "duration", description: "your preferred project duration" },
];

const numberWords = ["", "One", "Two", "Three", "Four", "Five", "Six"];

function formatList(items) {
  if (items.length < 2) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function RequiredProfile() {
  const navigate = useNavigate();
  const [accountName, setAccountName] = useState("");
  const [values, setValues] = useState({
    role: "",
    skills: [],
    skillLevel: "",
    goals: "",
    weeklyAvailability: "",
    duration: "",
  });
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState("idle");

  const missingFields = missingFieldDetails.filter(
    ({ field }) => errors[field],
  );
  const isSaving = saveStatus === "saving";
  const isSaved = saveStatus === "saved";

  useEffect(() => {
    let isMounted = true;

    getMyProfile()
      .then((profileData) => {
        if (isMounted && profileData.user?.name) {
          setAccountName(profileData.user.name);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSkillChange(event) {
    const { checked, value } = event.target;
    setValues((current) => ({
      ...current,
      skills: checked
        ? [...current.skills, value]
        : current.skills.filter((skill) => skill !== value),
    }));
    setErrors((current) => ({ ...current, skills: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || isSaved) {
      return;
    }

    const nextErrors = {};
    if (!values.role) {
      nextErrors.role = "Choose your professional role.";
    }
    if (values.skills.length === 0) {
      nextErrors.skills = "Select at least one skill.";
    }
    if (!values.skillLevel) {
      nextErrors.skillLevel = "Choose your skill level.";
    }
    if (!values.goals.trim()) {
      nextErrors.goals = "Add your goals.";
    }
    if (!values.weeklyAvailability) {
      nextErrors.weeklyAvailability = "Add your weekly availability.";
    }
    if (!values.duration) {
      nextErrors.duration = "Choose your preferred project duration.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    try {
      await saveProfile(values);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    }
  }

  return (
    <AuthLayout
      step="Step 2 of 2 · Required profile"
      title="Tell us what you bring"
      description="Find projects that fit your skills and availability."
      backTo="/welcome"
      backLabel="Back to welcome"
    >
      {accountName && (
        <p className={styles.accountName}>
          Name from your account: {accountName}
        </p>
      )}

      {missingFields.length > 0 && (
        <Alert
          variant="error"
          title={`${numberWords[missingFields.length]} ${missingFields.length === 1 ? "detail is" : "details are"} missing`}
        >
          Choose{" "}
          {formatList(missingFields.map(({ description }) => description))}.
          {" "}Other entries are kept.
        </Alert>
      )}
      {saveStatus === "failed" && (
        <Alert variant="error" title="Your profile did not save">
          Your entries are still here. Retry when you are connected.
        </Alert>
      )}
      {isSaved && (
        <Alert variant="success" title="Required profile saved">
          {values.role} · {values.skillLevel} · {values.weeklyAvailability}
          {" "}hours/week · {values.duration.replace(" weeks", "")}
          {" "}weeks. You can now discover projects.
        </Alert>
      )}

      <form className={styles.profileForm} onSubmit={handleSubmit} noValidate>
        <Select
          id="required-profile-role"
          name="role"
          label="Professional role"
          required
          options={roles}
          placeholder="Choose your role"
          value={values.role}
          onChange={handleChange}
          error={errors.role}
          disabled={isSaving || isSaved}
        />

        <fieldset
          className={`${styles.skillsField} ${errors.skills ? styles.skillsFieldError : ""}`}
          disabled={isSaving || isSaved}
        >
          <legend>Skills *</legend>
          <div className={styles.skillsList}>
            {skills.map((skill) => (
              <Checkbox
                key={skill}
                label={skill}
                value={skill}
                checked={values.skills.includes(skill)}
                onChange={handleSkillChange}
              />
            ))}
          </div>
          <p className={styles.helper}>You can select more than one skill.</p>
          {errors.skills && (
            <p className={styles.error} role="alert">
              <span aria-hidden="true">!</span>
              {errors.skills}
            </p>
          )}
        </fieldset>

        <Select
          id="required-profile-level"
          name="skillLevel"
          label="Skill level"
          required
          options={skillLevels}
          placeholder="Choose your skill level"
          value={values.skillLevel}
          onChange={handleChange}
          error={errors.skillLevel}
          helperText="Your own assessment, not a score."
          disabled={isSaving || isSaved}
        />

        <Input
          id="required-profile-goals"
          name="goals"
          label="Goals"
          required
          multiline
          rows="3"
          placeholder="Practice defining requirements and coordinating a small product team."
          value={values.goals}
          onChange={handleChange}
          error={errors.goals}
          disabled={isSaving || isSaved}
        />

        <Input
          id="required-profile-availability"
          name="weeklyAvailability"
          label="Weekly availability (hours)"
          type="number"
          min="0"
          step="1"
          required
          placeholder="5 hours / week"
          value={values.weeklyAvailability}
          onChange={handleChange}
          error={errors.weeklyAvailability}
          disabled={isSaving || isSaved}
        />

        <Select
          id="required-profile-duration"
          name="duration"
          label="Preferred project duration"
          required
          options={durations}
          placeholder="Choose a project duration"
          value={values.duration}
          onChange={handleChange}
          error={errors.duration}
          disabled={isSaving || isSaved}
        />

        {isSaved ? (
          <Button
            type="button"
            fullWidth
            onClick={() => navigate("/dashboard")}
          >
            Open dashboard
          </Button>
        ) : (
          <Button
            type="submit"
            fullWidth
            loading={isSaving}
            loadingText="Saving profile..."
          >
            {saveStatus === "failed"
              ? "Retry profile save"
              : "Save profile and continue"}
          </Button>
        )}
        <p className={styles.localNote}>
          {isSaved ? "Your profile is saved." : "These entries are local until you save."}
        </p>
      </form>
    </AuthLayout>
  );
}

export default RequiredProfile;
