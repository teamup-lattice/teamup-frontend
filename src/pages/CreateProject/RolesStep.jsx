import { useContext, useState } from "react";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import Input from "../../components/Input";
import { WizardContext } from "./WizardContextValue";
import styles from "./RolesStep.module.css";

const ALL_SKILLS = [
  "UI design",
  "Prototyping",
  "Frontend development",
  "React",
  "Product planning",
  "User research",
];

function RolesStep() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("RolesStep must be used within a WizardProvider.");
  }

  const {
    roles,
    setRoles,
    draftId,
    saveStatus,
    setSaveStatus,
    saveDraft,
    goNext,
    goBack,
    markStepIncomplete,
    ownerName = "You",
  } = context;

  const [showValidation, setShowValidation] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    title: "",
    responsibilities: "",
    skills: [],
  });
  const [newRoleError, setNewRoleError] = useState(null);

  const isSaving = saveStatus === "saving";

  // Calculate open roles count
  const parsedTeamSize = parseInt(roles.teamSize, 10);
  const openRolesCount = !Number.isNaN(parsedTeamSize) && parsedTeamSize > 0
    ? Math.max(0, parsedTeamSize - 1)
    : roles.roles.filter((r) => !r.isOwner).length;

  const teamSizeHelper = `${ownerName} · Project Owner. ${openRolesCount} role${
    openRolesCount === 1 ? "" : "s"
  } ${openRolesCount === 1 ? "is" : "are"} open for recruitment.`;

  // Validation
  const isTeamSizeValid =
    Boolean(roles.teamSize) &&
    !Number.isNaN(parsedTeamSize) &&
    parsedTeamSize > 0;

  const rolesMissingSkills = roles.roles.filter(
    (role) => !role.skills || role.skills.length === 0,
  );
  const rolesMissingTitle = roles.roles.filter(
    (role) => !role.title || !role.title.trim(),
  );
  const rolesMissingResponsibilities = roles.roles.filter(
    (role) => !role.responsibilities || !role.responsibilities.trim(),
  );

  const updateRoleField = (id, field, value) => {
    setRoles((current) => ({
      ...current,
      roles: current.roles.map((role) =>
        role.id === id ? { ...role, [field]: value } : role,
      ),
    }));
  };

  const toggleRoleSkill = (id, skill) => {
    setRoles((current) => ({
      ...current,
      roles: current.roles.map((role) => {
        if (role.id !== id) return role;
        const selected = role.skills?.includes(skill);
        const nextSkills = selected
          ? role.skills.filter((s) => s !== skill)
          : [...(role.skills || []), skill];
        return { ...role, skills: nextSkills };
      }),
    }));
  };

  const toggleNewRoleSkill = (skill) => {
    setNewRole((prev) => {
      const selected = prev.skills.includes(skill);
      return {
        ...prev,
        skills: selected
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
    setSaveStatus("idle");
  };

  const handleKeepNewRole = () => {
    if (!newRole.title.trim() || !newRole.responsibilities.trim() || newRole.skills.length === 0) {
      setNewRoleError(true);
      return;
    }
    const createdRole = {
      id: `role-${Date.now()}`,
      title: newRole.title.trim(),
      responsibilities: newRole.responsibilities.trim(),
      skills: [...newRole.skills],
      isOwner: false,
    };
    setRoles((current) => ({
      ...current,
      roles: [...current.roles, createdRole],
    }));
    setNewRole({ title: "", responsibilities: "", skills: [] });
    setNewRoleError(false);
    setIsAddingRole(false);
  };

  const confirmRemoveRole = (roleId) => {
    setRoles((current) => ({
      ...current,
      roles: current.roles.filter((r) => r.id !== roleId),
    }));
    setRoleToRemove(null);
  };

  const handleContinue = () => {
    setShowValidation(true);
    if (!isTeamSizeValid) {
      markStepIncomplete(2);
      document.getElementById("team-size")?.focus();
      return;
    }
    if (roles.roles.length === 0) {
      markStepIncomplete(2);
      return;
    }
    if (rolesMissingTitle.length > 0) {
      markStepIncomplete(2);
      document.getElementById(`role-title-${rolesMissingTitle[0].id}`)?.focus();
      return;
    }
    if (rolesMissingResponsibilities.length > 0) {
      markStepIncomplete(2);
      document
        .getElementById(
          `role-responsibilities-${rolesMissingResponsibilities[0].id}`,
        )
        ?.focus();
      return;
    }
    if (rolesMissingSkills.length > 0) {
      markStepIncomplete(2);
      document
        .getElementById(`role-skills-${rolesMissingSkills[0].id}`)
        ?.focus();
      return;
    }

    goNext();
  };

  // Determine alert message for invalid state
  let validationAlert = null;
  if (showValidation) {
    if (!isTeamSizeValid) {
      validationAlert = (
        <Alert variant="error" title="Add team size">
          <>
            Enter your project&apos;s team size.
            <br />
            <a
              className={styles.focusLink}
              href="#team-size"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("team-size")?.focus();
              }}
            >
              Go to team size
            </a>
          </>
        </Alert>
      );
    } else if (rolesMissingSkills.length > 0) {
      const firstMissing = rolesMissingSkills[0];
      const roleName = firstMissing.title || "Role";
      validationAlert = (
        <Alert variant="error" title={`${roleName} needs skills`}>
          <>
            Title and responsibilities are kept. Select the skills needed for
            this role.
            <br />
            <a
              className={styles.focusLink}
              href={`#role-skills-${firstMissing.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`role-skills-${firstMissing.id}`)
                  ?.focus();
              }}
            >
              Go to {roleName} skills
            </a>
          </>
        </Alert>
      );
    } else if (
      rolesMissingTitle.length > 0 ||
      rolesMissingResponsibilities.length > 0
    ) {
      const targetRole =
        rolesMissingTitle[0] || rolesMissingResponsibilities[0];
      const isTitle = rolesMissingTitle.length > 0;
      const targetId = isTitle
        ? `role-title-${targetRole.id}`
        : `role-responsibilities-${targetRole.id}`;
      validationAlert = (
        <Alert variant="error" title="Complete role details">
          <>
            Enter a title and responsibilities for each role.
            <br />
            <a
              className={styles.focusLink}
              href={`#${targetId}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(targetId)?.focus();
              }}
            >
              Go to {isTitle ? "role title" : "responsibilities"}
            </a>
          </>
        </Alert>
      );
    }
  }

  return (
    <section className={styles.card} aria-labelledby="roles-heading">
      <span className={styles.badge}>
        {draftId ? "Draft" : "New · unsaved"}
      </span>
      <h1 id="roles-heading" className={styles.heading}>
        Define your team and roles
      </h1>
      <p className={styles.description}>
        Define each role&apos;s responsibilities and required skills.
      </p>
      <p className={styles.localChanges}>
        {saveStatus === "saved"
          ? "All changes saved."
          : "Local changes · not saved yet."}
      </p>

      {validationAlert}

      {saveStatus === "saving" && (
        <Alert variant="info" title="Saving roles...">
          Saving roles. Entries retained; save temporarily locked.
        </Alert>
      )}
      {saveStatus === "saved" && (
        <Alert variant="success" title="Draft saved">
          Team size and role entries are persisted. Resume from My Projects.
        </Alert>
      )}
      {saveStatus === "failed" && (
        <Alert variant="error" title="Draft did not save">
          Save failed. Saved draft unchanged; local entries retained. Retry.
        </Alert>
      )}

      <div className={styles.fields}>
        <div className={styles.teamSizeWrapper}>
          <Input
            id="team-size"
            label="Team size"
            required
            type="number"
            min="1"
            helperText={teamSizeHelper}
            value={roles.teamSize}
            onChange={(e) =>
              setRoles((current) => ({ ...current, teamSize: e.target.value }))
            }
            error={
              showValidation && !isTeamSizeValid
                ? "! Add a team size."
                : undefined
            }
            disabled={isSaving}
          />
          {isSaving && (
            <p className={styles.lockedText}>
              Temporarily locked while saving.
            </p>
          )}
        </div>

        {roles.roles.map((role) => {
          const isOwner = role.isOwner;
          const roleTitleError =
            showValidation && (!role.title || !role.title.trim())
              ? "! Add a role title."
              : undefined;
          const roleRespError =
            showValidation &&
            (!role.responsibilities || !role.responsibilities.trim())
              ? "! Add responsibilities."
              : undefined;
          const roleSkillsError =
            showValidation && (!role.skills || role.skills.length === 0)
              ? "! Select required skills for this role."
              : undefined;

          if (roleToRemove && roleToRemove.id === role.id) {
            return (
              <div
                key={role.id}
                className={styles.confirmCard}
                role="alertdialog"
                aria-labelledby={`remove-title-${role.id}`}
              >
                <h2
                  id={`remove-title-${role.id}`}
                  className={styles.confirmTitle}
                >
                  Remove {role.title || "this role"}?
                </h2>
                <p className={styles.confirmBody}>
                  Remove this role? Other roles stay unchanged. Review linked
                  commitment entries; they will not be discarded automatically.
                </p>
                <Input
                  label="Role title"
                  required
                  value={role.title}
                  disabled
                />
                <div className={styles.confirmStackedButtons}>
                  <Button fullWidth onClick={() => setRoleToRemove(null)}>
                    Keep role
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => confirmRemoveRole(role.id)}
                  >
                    Remove this role
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <article
              key={role.id}
              className={styles.roleCard}
              aria-labelledby={`role-label-${role.id}`}
            >
              <div className={styles.roleCardHeader}>
                <span id={`role-label-${role.id}`} className={styles.roleRoleBadge}>
                  {isOwner ? `${ownerName} · Owner` : "Open role"}
                </span>
                {!isOwner && (
                  <button
                    type="button"
                    className={styles.removeLink}
                    onClick={() => setRoleToRemove(role)}
                    disabled={isSaving}
                  >
                    Review role removal
                  </button>
                )}
              </div>

              <div>
                <Input
                  id={`role-title-${role.id}`}
                  label="Role title"
                  required
                  value={role.title}
                  onChange={(e) =>
                    updateRoleField(role.id, "title", e.target.value)
                  }
                  error={roleTitleError}
                  disabled={isSaving}
                />
                {isSaving && (
                  <p className={styles.lockedText}>
                    Temporarily locked while saving.
                  </p>
                )}
              </div>

              <div>
                <Input
                  id={`role-responsibilities-${role.id}`}
                  label="Responsibilities"
                  required
                  multiline
                  value={role.responsibilities}
                  onChange={(e) =>
                    updateRoleField(role.id, "responsibilities", e.target.value)
                  }
                  error={roleRespError}
                  disabled={isSaving}
                />
                {isSaving && (
                  <p className={styles.lockedText}>
                    Temporarily locked while saving.
                  </p>
                )}
              </div>

              <fieldset
                id={`role-skills-${role.id}`}
                tabIndex={-1}
                className={`${styles.skillFieldset} ${
                  roleSkillsError ? styles.skillFieldsetError : ""
                }`}
              >
                <legend className={styles.fieldLabel}>
                  Required skills *
                </legend>
                <div className={styles.checkboxes}>
                  {ALL_SKILLS.map((skill) => (
                    <Checkbox
                      key={skill}
                      label={skill}
                      checked={Boolean(role.skills?.includes(skill))}
                      onChange={() => toggleRoleSkill(role.id, skill)}
                      disabled={isSaving}
                    />
                  ))}
                </div>
                {roleSkillsError && (
                  <p className={styles.fieldError}>{roleSkillsError}</p>
                )}
                {isSaving && (
                  <p className={styles.lockedText}>
                    Temporarily locked while saving.
                  </p>
                )}
                {role.skills && role.skills.length > 0 && (
                  <ul className={styles.chips} aria-label="Selected skills">
                    {role.skills.map((skill) => (
                      <li key={skill} className={styles.chip}>
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => toggleRoleSkill(role.id, skill)}
                          disabled={isSaving}
                          aria-label={`Remove ${skill}`}
                        >
                          Remove ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>
            </article>
          );
        })}

        {isAddingRole && (
          <div className={styles.editorCard}>
            <h2 className={styles.editorHeading}>Add a role</h2>
            <p className={styles.editorDescription}>
              Define a role before publishing. Your other role cards are kept.
            </p>

            <Input
              id="new-role-title"
              label="Role title"
              required
              value={newRole.title}
              onChange={(e) => {
                setNewRole((prev) => ({ ...prev, title: e.target.value }));
                setSaveStatus("idle");
              }}
              error={
                newRoleError && !newRole.title.trim()
                  ? "! Add a role title."
                  : undefined
              }
              disabled={isSaving}
            />

            <Input
              id="new-role-responsibilities"
              label="Responsibilities"
              required
              multiline
              value={newRole.responsibilities}
              onChange={(e) => {
                setNewRole((prev) => ({
                  ...prev,
                  responsibilities: e.target.value,
                }));
                setSaveStatus("idle");
              }}
              error={
                newRoleError && !newRole.responsibilities.trim()
                  ? "! Add responsibilities."
                  : undefined
              }
              disabled={isSaving}
            />

            <fieldset
              className={`${styles.skillFieldset} ${
                newRoleError && newRole.skills.length === 0
                  ? styles.skillFieldsetError
                  : ""
              }`}
            >
              <legend className={styles.fieldLabel}>Required skills *</legend>
              <div className={styles.checkboxes}>
                {ALL_SKILLS.map((skill) => (
                  <Checkbox
                    key={skill}
                    label={skill}
                    checked={newRole.skills.includes(skill)}
                    onChange={() => toggleNewRoleSkill(skill)}
                    disabled={isSaving}
                  />
                ))}
              </div>
              {newRoleError && newRole.skills.length === 0 && (
                <p className={styles.fieldError}>
                  ! Select required skills for this role.
                </p>
              )}
              {newRole.skills.length > 0 && (
                <ul className={styles.chips} aria-label="Selected skills">
                  {newRole.skills.map((skill) => (
                    <li key={skill} className={styles.chip}>
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => toggleNewRoleSkill(skill)}
                        disabled={isSaving}
                        aria-label={`Remove ${skill}`}
                      >
                        Remove ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <div className={styles.editorActions}>
              <Button onClick={handleKeepNewRole} disabled={isSaving}>
                Keep role entry
              </Button>
              <button
                type="button"
                className={styles.removeLink}
                onClick={() => {
                  setIsAddingRole(false);
                  setNewRoleError(false);
                  setNewRole({ title: "", responsibilities: "", skills: [] });
                }}
                disabled={isSaving}
              >
                Review removal
              </button>
            </div>
          </div>
        )}

        {!isAddingRole && (
          <div className={styles.addRoleSection}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsAddingRole(true)}
              disabled={isSaving}
            >
              Add another role
            </Button>
          </div>
        )}
      </div>

      <p className={styles.saveNote}>
        Back and Continue keep local entries; Save draft saves them.
      </p>
      <div className={styles.actions}>
        <Button fullWidth onClick={handleContinue} disabled={isSaving}>
          Continue to commitment
        </Button>
        <div className={styles.projectActionsRow}>
          {saveStatus === "saved" ? (
            <AltLink to="/projects">My Projects</AltLink>
          ) : (
            <button
              type="button"
              className={styles.backLink}
              onClick={goBack}
              disabled={isSaving}
            >
              Back
            </button>
          )}
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

export default RolesStep;
