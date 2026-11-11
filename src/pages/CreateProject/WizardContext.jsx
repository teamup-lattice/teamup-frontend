import { useEffect, useRef, useState } from "react";
import {
  createProjectDraft,
  publishProject as publishProjectService,
  updateProjectDraft,
} from "../../services/projectService";
import { getSkills } from "../../services/profileService";
import { WizardContext } from "./WizardContextValue";

const initialBasics = {
  name: "",
  problem: "",
  description: "",
  projectType: "",
  skills: [],
  outcome: "",
};

const initialRoles = {
  teamSize: "",
  roles: [
    {
      id: "owner-role",
      title: "",
      responsibilities: "",
      skills: [],
      isOwner: true,
    },
  ],
};

const initialCommitment = {
  duration: "",
  startDate: "",
  endDate: "",
  hoursByRole: {},
  availability: "",
  responseExpectation: "",
};

const initialMilestones = [];

function buildProjectPayload({ basics, roles, commitment, milestones }) {
  const data = {};
  const addTextField = (field, value) => {
    if (typeof value === "string" && value.trim()) {
      data[field] = value.trim();
    }
  };
  const addIsoDateField = (field, value) => {
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      data[field] = date.toISOString();
    }
  };

  addTextField("title", basics.name);
  addTextField("problem", basics.problem);
  addTextField("description", basics.description);
  addTextField("outcome", basics.outcome);
  addIsoDateField("startDate", commitment.startDate);
  addIsoDateField("targetEndDate", commitment.endDate);
  addTextField("availabilityExpectation", commitment.availability);
  addTextField(
    "availabilityResponseExpectation",
    commitment.responseExpectation,
  );

  const projectTypeMap = {
    "web-application": "WEB_APPLICATION",
  };
  const projectType = projectTypeMap[basics.projectType];
  if (projectType) {
    data.projectType = projectType;
  }

  const teamSizeValue = roles.teamSize?.trim();
  if (teamSizeValue) {
    const teamSize = Number(teamSizeValue);
    if (Number.isFinite(teamSize)) {
      data.teamSize = teamSize;
    }
  }

  const durationMatch = commitment.duration
    ?.trim()
    .match(/^(\d+(?:\.\d+)?)\s*(?:weeks?)?$/i);
  if (durationMatch) {
    const durationWeeks = Number(durationMatch[1]);
    if (durationWeeks >= 1 && durationWeeks <= 52) {
      data.durationWeeks = durationWeeks;
    }
  }

  data.skills = (Array.isArray(basics.skills) ? basics.skills : [])
    .filter(
      (skillId) =>
        skillId !== undefined &&
        skillId !== null &&
        String(skillId).trim() !== "",
    )
    .map((skillId) => ({
      skillId,
      required: true,
      minLevel: "BEGINNER",
    }));

  data.roles = (Array.isArray(roles.roles) ? roles.roles : []).flatMap(
    (role) => {
      const title = role.title?.trim();
      if (!title) {
        return [];
      }

      const roleData = { title };
      const description = role.responsibilities?.trim();
      if (description) {
        roleData.description = description;
      }

      const hoursValue = commitment.hoursByRole?.[role.id];
      if (hoursValue !== undefined && String(hoursValue).trim()) {
        const hoursPerWeek = Number(hoursValue);
        if (Number.isFinite(hoursPerWeek)) {
          roleData.hoursPerWeek = hoursPerWeek;
        }
      }

      roleData.skills = (Array.isArray(role.skills) ? role.skills : [])
        .filter(
          (skillId) =>
            skillId !== undefined &&
            skillId !== null &&
            String(skillId).trim() !== "",
        )
        .map((skillId) => ({
          skillId,
          required: true,
          minLevel: "BEGINNER",
        }));

      return [roleData];
    },
  );

  data.milestones = (Array.isArray(milestones) ? milestones : []).flatMap(
    (milestone, index) => {
      const title = milestone.name?.trim();
      const date = milestone.date?.trim();
      if (!title || !date) {
        return [];
      }

      const dueDate = new Date(date);
      if (
        Number.isNaN(dueDate.getTime()) ||
        dueDate.toISOString().slice(0, 10) !== date
      ) {
        return [];
      }

      return [{ title, dueDate: dueDate.toISOString(), sortOrder: index }];
    },
  );

  return data;
}

export function WizardProvider({ children, initialDraftId = null }) {
  const [draftId, setDraftId] = useState(initialDraftId);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [basics, setBasics] = useState(initialBasics);
  const [roles, setRoles] = useState(initialRoles);
  const [commitment, setCommitment] = useState(initialCommitment);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [publishStatus, setPublishStatus] = useState("idle");
  const [publishError, setPublishError] = useState(null);
  const [publishedProjectId, setPublishedProjectId] = useState(null);
  const saveInFlightRef = useRef(false);
  const publishInFlightRef = useRef(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillsLoadStatus, setSkillsLoadStatus] = useState("loading");
  const [skillsLoadAttempt, setSkillsLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getSkills()
      .then((result) => {
        const skills = Array.isArray(result?.skills)
          ? result.skills.filter(
              (skill) =>
                skill?.id !== undefined &&
                skill?.id !== null &&
                typeof skill.name === "string" &&
                skill.name.trim(),
            )
          : [];

        if (skills.length === 0) {
          throw new Error("No skills returned");
        }

        if (isMounted) {
          setAvailableSkills(skills);
          setSkillsLoadStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvailableSkills([]);
          setSkillsLoadStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [skillsLoadAttempt]);

  const retrySkills = () => {
    setSkillsLoadStatus("loading");
    setSkillsLoadAttempt((attempt) => attempt + 1);
  };

  const skillGroups = availableSkills.reduce((groups, skill) => {
    const category = skill.category?.trim() || "Other";
    let group = groups.find((item) => item.category === category);
    if (!group) {
      group = { category, skills: [] };
      groups.push(group);
    }
    group.skills.push(skill);
    return groups;
  }, []);

  const ownerName = "You";

  const updateBasics = (updates) => {
    setBasics((current) => ({ ...current, ...updates }));
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
  };

  const updateRoles = (updatesOrFn) => {
    setRoles((current) =>
      typeof updatesOrFn === "function"
        ? updatesOrFn(current)
        : { ...current, ...updatesOrFn },
    );
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
  };

  const updateCommitment = (updatesOrFn) => {
    setCommitment((current) =>
      typeof updatesOrFn === "function"
        ? updatesOrFn(current)
        : { ...current, ...updatesOrFn },
    );
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
  };

  const updateMilestones = (updatesOrFn) => {
    setMilestones((current) =>
      typeof updatesOrFn === "function" ? updatesOrFn(current) : updatesOrFn,
    );
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
  };

  const handleSetCurrentStep = (stepOrFn) => {
    setSaveStatus("idle");
    setCurrentStep(stepOrFn);
  };

  const goNext = () => {
    if (currentStep >= 5) {
      return;
    }

    setSaveStatus("idle");
    setCompletedSteps((steps) =>
      steps.includes(currentStep) ? steps : [...steps, currentStep],
    );
    setCurrentStep((step) => Math.min(step + 1, 5));
  };

  const markStepIncomplete = (stepToReopen) => {
    setCompletedSteps((steps) => steps.filter((step) => step !== stepToReopen));
  };

  const goBack = () => {
    setSaveStatus("idle");
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const saveDraft = async () => {
    if (saveInFlightRef.current || publishInFlightRef.current) {
      return;
    }

    saveInFlightRef.current = true;
    setSaveStatus("saving");
    try {
      const data = buildProjectPayload({ basics, roles, commitment, milestones });
      if (draftId) {
        await updateProjectDraft(draftId, data);
      } else {
        const result = await createProjectDraft(data);
        const createdDraftId = result?.project?.id ?? result?.id;
        if (!createdDraftId) {
          throw new Error("Draft creation response did not include an ID");
        }
        setDraftId(createdDraftId);
      }

      // TODO: Load skills with backend IDs before adding them to the payload.

      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    } finally {
      saveInFlightRef.current = false;
    }
  };

  const publishProject = async () => {
    if (publishInFlightRef.current || saveInFlightRef.current) {
      return;
    }

    publishInFlightRef.current = true;
    setPublishError(null);
    setPublishStatus("publishing");
    setSaveStatus("saving");
    let payloadSaved = false;
    try {
      const data = buildProjectPayload({ basics, roles, commitment, milestones });
      let projectId = draftId;

      if (!projectId) {
        const created = await createProjectDraft(data);
        projectId = created?.project?.id ?? created?.id;
        if (!projectId) {
          throw new Error("Draft creation response did not include an ID");
        }
        setDraftId(projectId);
      }

      await updateProjectDraft(projectId, data);
      payloadSaved = true;
      setSaveStatus("saved");

      const result = await publishProjectService(projectId);
      setPublishedProjectId(result?.project?.id ?? result?.id ?? projectId);
      setPublishStatus("published");
    } catch (error) {
      if (!payloadSaved) {
        setSaveStatus("failed");
      }
      setPublishError({
        message:
          error?.message && error.message !== "Something went wrong"
            ? error.message
            : "",
        errors: error?.errors,
      });
      setPublishStatus("failed");
    } finally {
      publishInFlightRef.current = false;
    }
  };

  const value = {
    draftId,
    setDraftId,
    currentStep,
    setCurrentStep: handleSetCurrentStep,
    completedSteps,
    setCompletedSteps,
    basics,
    setBasics: updateBasics,
    roles,
    setRoles: updateRoles,
    commitment,
    setCommitment: updateCommitment,
    milestones,
    setMilestones: updateMilestones,
    saveStatus,
    setSaveStatus,
    publishStatus,
    setPublishStatus,
    publishError,
    publishedProjectId,
    availableSkills,
    skillsLoadStatus,
    skillGroups,
    retrySkills,
    ownerName,
    goNext,
    goBack,
    markStepIncomplete,
    saveDraft,
    publishProject,
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
