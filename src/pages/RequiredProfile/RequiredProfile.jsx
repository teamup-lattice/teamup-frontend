import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import Input from "../../components/Input";
import Select from "../../components/Select";
import {
  getProfile,
  getSkillCategories,
  getSkills,
  saveProfile,
} from "../../services/profileService";
import { getErrorMessage } from "../../services/errorMessage";
import styles from "./RequiredProfile.module.css";

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
  const [categories, setCategories] = useState([]);
  const [categoriesStatus, setCategoriesStatus] = useState("loading");
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoriesAttempt, setCategoriesAttempt] = useState(0);
  const [profileStatus, setProfileStatus] = useState("loading");
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [savedSkillIds, setSavedSkillIds] = useState([]);
  const [savedDurationWeeks, setSavedDurationWeeks] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillsStatus, setSkillsStatus] = useState("idle");
  const [skillsAttempt, setSkillsAttempt] = useState(0);
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
  const [saveError, setSaveError] = useState(null);

  const roleTouchedRef = useRef(false);
  const rolePrefilledRef = useRef(false);
  const touchedFieldsRef = useRef({});
  const skillsTouchedRef = useRef(false);
  const skillsRequestRef = useRef(0);
  const categoriesRef = useRef([]);
  const profileRef = useRef(null);
  const savedSkillIdsRef = useRef([]);

  const roleOptions = categories.map((category) => ({
    value: category,
    label: category,
  }));
  const durationOptions =
    savedDurationWeeks !== null &&
    !durations.some(
      ({ value }) => value === `${savedDurationWeeks} weeks`,
    )
      ? [
          ...durations,
          {
            value: `${savedDurationWeeks} weeks`,
            label: `${savedDurationWeeks} weeks`,
          },
        ]
      : durations;

  const missingFields = missingFieldDetails.filter(
    ({ field }) => errors[field],
  );
  const isSaving = saveStatus === "saving";
  const isSaved = saveStatus === "saved";
  const visibleSkillIds = new Set(
    skills.map((skill) => String(skill.id)),
  );
  const hiddenSavedSkillIds = savedSkillIds.filter(
    (skillId) => !visibleSkillIds.has(String(skillId)),
  );
  const hiddenSavedSkillCount =
    skillsStatus === "ready" ? hiddenSavedSkillIds.length : 0;
  const canSubmit =
    categoriesStatus === "ready" &&
    profileStatus === "ready" &&
    (!values.role || skillsStatus === "ready") &&
    !isSaving &&
    !isSaved;

  function applyRolePrefill() {
    if (rolePrefilledRef.current || roleTouchedRef.current) return;

    const categoryList = categoriesRef.current;
    const profile = profileRef.current;
    if (!profile || categoryList.length === 0) return;

    const headline =
      typeof profile.role === "string" ? profile.role.trim() : "";
    if (!headline) return;

    const match = categoryList.find((category) => category === headline);
    if (!match) return;

    rolePrefilledRef.current = true;
    setValues((current) =>
      current.role ? current : { ...current, role: match },
    );
    setSkills([]);
    setSkillsStatus("loading");
    setErrors((current) => ({ ...current, role: undefined, skills: undefined }));
  }

  useEffect(() => {
    let isMounted = true;

    getSkillCategories()
      .then((result) => {
        if (!isMounted) return;
        const nextCategories = Array.isArray(result?.categories)
          ? result.categories.filter(
              (category) =>
                typeof category === "string" && category.trim().length > 0,
            )
          : [];
        categoriesRef.current = nextCategories;
        setCategories(nextCategories);
        setCategoriesError(null);
        setCategoriesStatus(nextCategories.length > 0 ? "ready" : "empty");
        applyRolePrefill();
      })
      .catch((error) => {
        if (!isMounted) return;
        categoriesRef.current = [];
        setCategories([]);
        setCategoriesError(error);
        setCategoriesStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [categoriesAttempt]);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((profile) => {
        if (!isMounted) return;
        profileRef.current = profile;

        if (profile.name) {
          setAccountName(profile.name);
        }

        const nextSkillIds = Array.isArray(profile.skillIds)
          ? profile.skillIds
          : [];
        savedSkillIdsRef.current = nextSkillIds;
        setSavedSkillIds(nextSkillIds);

        const durationWeeks = Number(profile.durationWeeks);
        const nextDurationWeeks =
          Number.isFinite(durationWeeks) && durationWeeks > 0
            ? durationWeeks
            : null;
        setSavedDurationWeeks(nextDurationWeeks);

        setValues((current) => {
          const next = { ...current };
          const touched = touchedFieldsRef.current;

          if (
            !touched.skillLevel &&
            skillLevels.some(
              ({ value }) => value === profile.skillLevel,
            )
          ) {
            next.skillLevel = profile.skillLevel;
          }
          if (!touched.goals) {
            next.goals = profile.goals ?? "";
          }
          if (
            !touched.weeklyAvailability &&
            profile.availabilityHours !== null &&
            profile.availabilityHours !== undefined &&
            profile.availabilityHours !== ""
          ) {
            next.weeklyAvailability = String(profile.availabilityHours);
          }
          if (!touched.duration && nextDurationWeeks !== null) {
            next.duration = `${nextDurationWeeks} weeks`;
          }

          return next;
        });
        setProfileStatus("ready");
        applyRolePrefill();
      })
      .catch(() => {
        if (isMounted) setProfileStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [profileAttempt]);

  useEffect(() => {
    const category = values.role;
    const requestId = skillsRequestRef.current + 1;
    skillsRequestRef.current = requestId;
    let isMounted = true;

    if (!category) {
      return () => {
        isMounted = false;
      };
    }

    getSkills(category)
      .then((result) => {
        if (!isMounted || requestId !== skillsRequestRef.current) return;

        const nextSkills = Array.isArray(result?.skills)
          ? result.skills.filter(
              (skill) =>
                skill?.id !== undefined &&
                skill?.id !== null &&
                typeof skill.name === "string" &&
                skill.name.trim().length > 0,
            )
          : [];
        const visibleIds = new Set(
          nextSkills.map((skill) => String(skill.id)),
        );
        const nextSelected = savedSkillIdsRef.current.filter((skillId) =>
          visibleIds.has(String(skillId)),
        );

        setSkills(nextSkills);
        skillsTouchedRef.current = false;
        setValues((current) => ({ ...current, skills: nextSelected }));
        setSkillsStatus(nextSkills.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (!isMounted || requestId !== skillsRequestRef.current) return;
        setSkills([]);
        setSkillsStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [values.role, skillsAttempt]);

  useEffect(() => {
    if (
      profileStatus !== "ready" ||
      skillsStatus !== "ready" ||
      skillsTouchedRef.current
    ) {
      return;
    }

    const visibleIds = new Set(
      skills.map((skill) => String(skill.id)),
    );
    const nextSelected = savedSkillIds.filter((skillId) =>
      visibleIds.has(String(skillId)),
    );

    setValues((current) => {
      const isSame =
        current.skills.length === nextSelected.length &&
        current.skills.every(
          (skillId, index) =>
            String(skillId) === String(nextSelected[index]),
        );
      return isSame ? current : { ...current, skills: nextSelected };
    });
  }, [profileStatus, skillsStatus, skills, savedSkillIds]);

  function retryCategories() {
    categoriesRef.current = [];
    setCategories([]);
    setCategoriesStatus("loading");
    setCategoriesAttempt((attempt) => attempt + 1);
  }

  function retryProfile() {
    setProfileStatus("loading");
    setProfileAttempt((attempt) => attempt + 1);
  }

  function retrySkills() {
    setSkills([]);
    setSkillsStatus("loading");
    setErrors((current) => ({ ...current, skills: undefined }));
    setSkillsAttempt((attempt) => attempt + 1);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    touchedFieldsRef.current[name] = true;

    if (name === "role") {
      roleTouchedRef.current = true;
      skillsTouchedRef.current = false;
      setValues((current) => ({ ...current, role: value, skills: [] }));
      setSkills([]);
      setSkillsStatus(value ? "loading" : "idle");
      setErrors((current) => ({
        ...current,
        role: undefined,
        skills: undefined,
      }));
      return;
    }

    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSkillChange(event) {
    const { checked, value } = event.target;
    const skillId = skills.find((skill) => String(skill.id) === value)?.id;
    if (skillId === undefined) return;

    skillsTouchedRef.current = true;
    setValues((current) => ({
      ...current,
      skills: checked
        ? [...current.skills, skillId]
        : current.skills.filter((selectedSkill) => selectedSkill !== skillId),
    }));
    setErrors((current) => ({ ...current, skills: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || isSaved) {
      return;
    }
    if (categoriesStatus !== "ready" || profileStatus !== "ready") {
      setSaveStatus("idle");
      return;
    }

    const nextErrors = {};
    if (!values.role || !categories.includes(values.role)) {
      nextErrors.role = "Choose your professional role.";
    }
    if (values.role) {
      if (skillsStatus === "error") {
        nextErrors.skills = "Skills could not be loaded. Try again.";
      } else if (skillsStatus === "empty") {
        nextErrors.skills = "No skills are available for this role.";
      } else if (skillsStatus !== "ready") {
        nextErrors.skills = "Wait for skills to load.";
      } else if (values.skills.length === 0) {
        nextErrors.skills = "Select at least one skill.";
      }
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

    if (skillsStatus !== "ready" || values.skills.length === 0) {
      setSaveStatus("idle");
      return;
    }

    const skillIdsToSave = [...values.skills];
    for (const skillId of savedSkillIdsRef.current) {
      if (
        !visibleSkillIds.has(String(skillId)) &&
        !skillIdsToSave.some(
          (selectedSkillId) => String(selectedSkillId) === String(skillId),
        )
      ) {
        skillIdsToSave.push(skillId);
      }
    }

    setSaveStatus("saving");
    try {
      await saveProfile({ ...values, skills: skillIdsToSave });
      setSaveError(null);
      setSaveStatus("saved");
    } catch (error) {
      setSaveError(error);
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

      {profileStatus === "error" && (
        <>
          <Alert variant="error" title="Your saved profile could not load">
            We could not load your existing details. Retry before saving so your
            saved data is not replaced.
          </Alert>
          <Button
            fullWidth
            variant="secondary"
            onClick={retryProfile}
            disabled={isSaving || isSaved}
          >
            Retry profile
          </Button>
        </>
      )}

      {categoriesStatus === "error" && (
        <>
          <Alert variant="error" title="Roles could not load">
            {getErrorMessage(categoriesError, {
              fallback: "We could not load the role categories. Try again.",
            })}
          </Alert>
          <Button
            fullWidth
            variant="secondary"
            onClick={retryCategories}
            disabled={isSaving || isSaved}
          >
            Retry roles
          </Button>
        </>
      )}

      {categoriesStatus === "empty" && (
        <>
          <Alert variant="info" title="No roles available">
            No role categories were returned. Try again.
          </Alert>
          <Button
            fullWidth
            variant="secondary"
            onClick={retryCategories}
            disabled={isSaving || isSaved}
          >
            Retry roles
          </Button>
        </>
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
          Your entries are still here.{" "}
          {getErrorMessage(saveError, { fallback: "Try again." })}
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
          options={roleOptions}
          placeholder={
            categoriesStatus === "loading"
              ? "Loading roles…"
              : "Choose your role"
          }
          helperText={
            categoriesStatus === "loading" ? "Loading role categories…" : undefined
          }
          value={values.role}
          onChange={handleChange}
          error={errors.role}
          disabled={isSaving || isSaved || categoriesStatus !== "ready"}
        />

        <fieldset
          className={`${styles.skillsField} ${errors.skills ? styles.skillsFieldError : ""}`}
          disabled={isSaving || isSaved}
          aria-busy={skillsStatus === "loading"}
        >
          <legend>Skills *</legend>

          {skillsStatus === "idle" && (
            <p className={styles.helper}>Choose a role to load skills.</p>
          )}

          {skillsStatus === "loading" && (
            <p className={styles.helper} role="status">
              Loading skills…
            </p>
          )}

          {skillsStatus === "error" && (
            <>
              <Alert variant="error" title="Skills could not load">
                We could not load skills for this role. Try again.
              </Alert>
              <Button
                fullWidth
                variant="secondary"
                onClick={retrySkills}
                disabled={isSaving || isSaved}
              >
                Retry skills
              </Button>
            </>
          )}

          {skillsStatus === "empty" && (
            <Alert variant="info" title="No skills available">
              No skills are available for this role. Choose another role or try
              again.
            </Alert>
          )}

          {skillsStatus === "ready" && (
            <>
              <div className={styles.skillsList}>
                {skills.map((skill) => (
                  <Checkbox
                    key={skill.id}
                    label={skill.name}
                    value={skill.id}
                    checked={values.skills.includes(skill.id)}
                    onChange={handleSkillChange}
                  />
                ))}
              </div>
              <p className={styles.helper}>
                You can select more than one skill.
              </p>
              {hiddenSavedSkillCount > 0 && (
                <p className={styles.helper}>
                  {hiddenSavedSkillCount} saved{" "}
                  {hiddenSavedSkillCount === 1 ? "skill" : "skills"} from other
                  roles will be kept.
                </p>
              )}
            </>
          )}

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
          options={durationOptions}
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
            disabled={!canSubmit}
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
