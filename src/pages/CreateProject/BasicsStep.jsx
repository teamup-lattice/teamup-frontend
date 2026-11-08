import { useContext, useState } from "react";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import Input from "../../components/Input";
import Select from "../../components/Select";
import { WizardContext } from "./WizardContextValue";
import styles from "./BasicsStep.module.css";

const fields = [
  { key: "name", label: "project name" },
  { key: "problem", label: "problem or opportunity" },
  { key: "description", label: "description" },
  { key: "projectType", label: "project type" },
  { key: "skills", label: "required skills" },
  { key: "outcome", label: "expected outcome" },
];

const fieldErrors = {
  name: "Add a project name.",
  problem: "Add the problem or opportunity.",
  description: "Describe what your team will build.",
  projectType: "Choose a project type.",
  skills: "Select required project skills.",
  outcome: "Add the intended outcome.",
};

function BasicsStep() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("BasicsStep must be used within a WizardProvider.");
  }

  const {
    basics,
    setBasics,
    skillGroups,
    availableSkills,
    skillsLoadStatus,
    retrySkills,
    draftId,
    saveStatus,
    saveDraft,
    goNext,
    markStepIncomplete,
  } = context;
  const [showValidation, setShowValidation] = useState(false);
  const isSaving = saveStatus === "saving";
  const selectedSkillIds = Array.isArray(basics.skills) ? basics.skills : [];
  const selectedSkills = selectedSkillIds
    .map((skillId) =>
      availableSkills.find((skill) => String(skill.id) === String(skillId)),
    )
    .filter((skill) => skill?.name);

  const missingFields = fields.filter((field) => {
    const value = basics[field.key];
    if (field.key === "skills" && skillsLoadStatus !== "ready") {
      return false;
    }
    return Array.isArray(value) ? value.length === 0 : !value.trim();
  });

  const updateField = (key, value) => {
    setBasics({ [key]: value });
  };

  const toggleSkill = (skillId) => {
    const selected = selectedSkillIds.some(
      (selectedId) => String(selectedId) === String(skillId),
    );
    updateField(
      "skills",
      selected
        ? selectedSkillIds.filter(
            (selectedId) => String(selectedId) !== String(skillId),
          )
        : [...selectedSkillIds, skillId],
    );
  };

  const focusMissingField = (event) => {
    event.preventDefault();
    document.getElementById(`project-${missingFields[0].key}`)?.focus();
  };

  const handleContinue = () => {
    setShowValidation(true);
    if (missingFields.length === 0) {
      goNext();
    } else {
      markStepIncomplete(1);
      document.getElementById(`project-${missingFields[0].key}`)?.focus();
    }
  };

  const fieldError = (key) =>
    showValidation && missingFields.some((field) => field.key === key)
      ? fieldErrors[key]
      : undefined;

  const missingNames = missingFields.map((field) => field.label);
  const validationMessage = missingFields.some((field) => field.key === "name")
    ? `Add ${missingNames.join(", ")}. Your project name is missing.`
    : `Add ${missingNames.join(", ")}. Your project name is kept.`;

  return (
    <section className={styles.card} aria-labelledby="basics-heading">
      {showValidation && missingFields.length > 0 && (
        <Alert variant="error" title="Complete your project basics">
          <>
            {validationMessage}
            <br />
            <a
              className={styles.focusLink}
              href={`#project-${missingFields[0].key}`}
              onClick={focusMissingField}
            >
              Go to {missingFields[0].label}
            </a>
          </>
        </Alert>
      )}

      {saveStatus === "saving" && (
        <Alert variant="info" title="Saving draft...">
          Saving. Your entries are retained; save not yet confirmed.
        </Alert>
      )}
      {saveStatus === "saved" && (
        <Alert variant="success" title="Draft saved">
          {basics.name || "Your project"} is saved and resumable from My
          Projects.
        </Alert>
      )}
      {saveStatus === "failed" && (
        <Alert variant="error" title="Draft did not save">
          Save failed. Local entries retained; no saved draft yet.
        </Alert>
      )}

      <span className={styles.badge}>
        {draftId ? "Draft" : "New · unsaved"}
      </span>
      <h1 id="basics-heading" className={styles.heading}>
        Project basics
      </h1>
      <p className={styles.description}>Describe what you'll build and why.</p>
      <p className={styles.requiredNote}>
        * Required to publish. Incomplete drafts can be saved.
      </p>

      <div className={styles.fields}>
        <Input
          id="project-name"
          label="Project name"
          required
          value={basics.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={fieldError("name")}
          disabled={isSaving}
        />
        <Input
          id="project-problem"
          label="Problem or opportunity"
          required
          value={basics.problem}
          onChange={(event) => updateField("problem", event.target.value)}
          error={fieldError("problem")}
          disabled={isSaving}
        />
        <Input
          id="project-description"
          label="Description"
          required
          multiline
          value={basics.description}
          onChange={(event) => updateField("description", event.target.value)}
          error={fieldError("description")}
          disabled={isSaving}
        />
        <Select
          id="project-projectType"
          label="Project type"
          required
          options={[{ value: "web-application", label: "Web application" }]}
          placeholder="Choose a project type"
          value={basics.projectType}
          onChange={(event) => updateField("projectType", event.target.value)}
          error={fieldError("projectType")}
          disabled={isSaving}
        />
        <fieldset
          className={`${styles.skillFieldset} ${fieldError("skills") ? styles.skillFieldsetError : ""}`}
        >
          <legend className={styles.fieldLabel}>Required skills *</legend>
          <div className={styles.checkboxes}>
            {skillsLoadStatus === "loading" && (
              <p role="status">Loading available skills...</p>
            )}
            {skillsLoadStatus === "error" && (
              <Alert variant="error" title="Skills could not be loaded">
                <Button
                  variant="secondary"
                  onClick={retrySkills}
                  disabled={isSaving}
                >
                  Retry loading skills
                </Button>
              </Alert>
            )}
            {skillsLoadStatus === "ready" &&
              skillGroups.map((group, groupIndex) => (
                <details
                  key={group.category}
                  className={styles.skillGroup}
                  open={groupIndex === 0}
                >
                  <summary className={styles.skillGroupHeading}>
                    {group.category} ({group.skills.length})
                  </summary>
                  <div className={styles.skillGroupOptions}>
                    {group.skills.map((skill) => (
                      <Checkbox
                        key={skill.id}
                        label={skill.name}
                        checked={selectedSkillIds.some(
                          (skillId) => String(skillId) === String(skill.id),
                        )}
                        onChange={() => toggleSkill(skill.id)}
                        disabled={isSaving}
                      />
                    ))}
                  </div>
                </details>
              ))}
          </div>
          {fieldError("skills") && (
            <p className={styles.fieldError}>! {fieldError("skills")}</p>
          )}
          {selectedSkills.length > 0 && (
            <ul className={styles.chips} aria-label="Selected skills">
              {selectedSkills.map((skill) => (
                <li key={skill.id} className={styles.chip}>
                  <span>{skill.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    disabled={isSaving}
                    aria-label={`Remove ${skill.name}`}
                  >
                    Remove ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <Input
          id="project-outcome"
          label="Expected outcome"
          required
          multiline
          value={basics.outcome}
          onChange={(event) => updateField("outcome", event.target.value)}
          error={fieldError("outcome")}
          disabled={isSaving}
        />
      </div>

      <p className={styles.saveNote}>
        Back and Continue keep local entries; Save draft saves them.
      </p>
      <div className={styles.actions}>
        <Button fullWidth onClick={handleContinue} disabled={isSaving}>
          Continue to roles
        </Button>
        <div className={styles.projectActionsRow}>
          <AltLink to="/projects">
            {saveStatus === "saved" ? "My Projects" : "Back to My Projects"}
          </AltLink>
          <Button
            variant="secondary"
            fullWidth
            onClick={saveDraft}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving draft..."
              : saveStatus === "failed"
                ? "Retry Save draft"
                : "Save draft"}
          </Button>
        </div>
      </div>
      <p className={styles.actionNote}>
        Save draft is available even with incomplete fields.
      </p>
    </section>
  );
}

export default BasicsStep;
