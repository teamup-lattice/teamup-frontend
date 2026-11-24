import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createProjectDraft,
  getProjectById,
  publishProject as publishProjectService,
  updateProjectDraft,
} from "../../services/projectService";
import { getSkills } from "../../services/profileService";
import { getFieldErrors } from "../../services/errorMessage";
import { WizardContext } from "./WizardContextValue";

const DRAFT_BACKUP_KEY = "teamup:createProject:draft";

const SAVE_FIELD_ALIASES = {
  title: "name",
  targetEndDate: "endDate",
  durationWeeks: "duration",
  availabilityExpectation: "availability",
  availabilityResponseExpectation: "responseExpectation",
};

function normalizeFieldErrors(error) {
  const fieldErrors = getFieldErrors(error);

  return Object.entries(fieldErrors).reduce((mapped, [field, message]) => {
    mapped[field] = message;
    const alias = SAVE_FIELD_ALIASES[field];
    if (alias) mapped[alias] = message;
    return mapped;
  }, {});
}

function readDraftBackup(draftId) {
  try {
    const raw = sessionStorage.getItem(DRAFT_BACKUP_KEY);
    if (!raw) {
      return null;
    }

    const backup = JSON.parse(raw);
    const backupDraftId = backup?.draftId ?? null;
    const draftIdMatches = draftId
      ? String(backupDraftId) === String(draftId)
      : backupDraftId === null;

    if (
      !Array.isArray(backup?.roles?.roles) ||
      backup.roles.roles.length === 0 ||
      !draftIdMatches
    ) {
      return null;
    }

    return backup;
  } catch {
    return null;
  }
}

function writeDraftBackup(backup) {
  try {
    sessionStorage.setItem(DRAFT_BACKUP_KEY, JSON.stringify(backup));
  } catch {
    return;
  }
}

function clearDraftBackup() {
  try {
    sessionStorage.removeItem(DRAFT_BACKUP_KEY);
  } catch {
    return;
  }
}

function getRoleTitleKey(role) {
  return (role?.title ?? "").trim().toLowerCase();
}

function mergeRoleLists(
  localRoles,
  serverRoles,
  { localIsAuthoritative = false } = {},
) {
  if (localIsAuthoritative) {
    return localRoles;
  }

  const merged = [...serverRoles];
  const mergedTitleKeys = new Set(
    merged.map((role) => getRoleTitleKey(role)).filter(Boolean),
  );
  let mergedHasOwner = merged.some((role) => Boolean(role?.isOwner));

  for (const localRole of localRoles) {
    const localId = localRole?.id ? String(localRole.id) : null;
    const titleKey = getRoleTitleKey(localRole);
    const matchingIdIndex = localId
      ? merged.findIndex((role) => String(role?.id) === localId)
      : -1;

    if (matchingIdIndex >= 0) {
      if (getRoleTitleKey(merged[matchingIdIndex]) !== titleKey) {
        merged[matchingIdIndex] = localRole;
      }
      continue;
    }

    if (titleKey && mergedTitleKeys.has(titleKey)) {
      continue;
    }

    if (localRole?.isOwner && mergedHasOwner) {
      continue;
    }

    merged.push(localRole);
    if (titleKey) {
      mergedTitleKeys.add(titleKey);
    }
    if (localRole?.isOwner) {
      mergedHasOwner = true;
    }
  }

  return merged;
}

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
  const navigate = useNavigate();
  const [draftId, setDraftId] = useState(initialDraftId);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [basics, setBasics] = useState(initialBasics);
  const [roles, setRoles] = useState(
    () => readDraftBackup(initialDraftId)?.roles ?? initialRoles,
  );
  const [commitment, setCommitment] = useState(initialCommitment);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState(null);
  const [saveFieldErrors, setSaveFieldErrors] = useState({});
  const [publishStatus, setPublishStatus] = useState("idle");
  const [publishError, setPublishError] = useState(null);
  const [publishedProjectId, setPublishedProjectId] = useState(null);
  const saveInFlightRef = useRef(false);
  const publishInFlightRef = useRef(false);
  const locallyCreatedDraftIdRef = useRef(null);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillsLoadStatus, setSkillsLoadStatus] = useState("loading");
  const [skillsLoadAttempt, setSkillsLoadAttempt] = useState(0);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(initialDraftId));
  const [draftLoadError, setDraftLoadError] = useState(null);

  useEffect(() => {
    if (isLoadingDraft || draftLoadError) {
      return;
    }

    writeDraftBackup({ draftId, roles });
  }, [draftId, roles, isLoadingDraft, draftLoadError]);

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

  useEffect(() => {
    if (!initialDraftId) {
      return;
    }

    if (String(initialDraftId) === locallyCreatedDraftIdRef.current) {
      return;
    }

    let isMounted = true;
    const hasDraftBackup = Boolean(readDraftBackup(initialDraftId));

    getProjectById(initialDraftId)
      .then((result) => {
        const project = result?.project ?? result;
        if (!project || !isMounted) {
          return;
        }

        // Uncomment to inspect the real shape while wiring this up:
        // console.log("Draft project response:", project);

        const projectTypeReverseMap = {
          WEB_APPLICATION: "web-application",
        };

        setBasics({
          name: project.title ?? "",
          problem: project.problem ?? "",
          description: project.description ?? "",
          projectType: projectTypeReverseMap[project.projectType] ?? "",
          skills: (Array.isArray(project.skills) ? project.skills : [])
            .map((entry) => entry?.skillId ?? entry?.skill?.id ?? entry?.id)
            .filter(Boolean),
          outcome: project.outcome ?? "",
        });

        const rawRoles = Array.isArray(project.roles) ? project.roles : [];
        const hoursByRole = {};
        const mappedRoles = rawRoles.map((role, index) => {
          const roleId = role.id ?? `role-${index}`;
          if (role.hoursPerWeek !== undefined && role.hoursPerWeek !== null) {
            hoursByRole[roleId] = String(role.hoursPerWeek);
          }
          return {
            id: roleId,
            title: role.title ?? "",
            responsibilities: role.description ?? "",
            skills: (Array.isArray(role.skills) ? role.skills : [])
              .map((entry) => entry?.skillId ?? entry?.skill?.id ?? entry?.id)
              .filter(Boolean),
            isOwner: Boolean(role.isOwner),
          };
        });

        const serverRoles =
          mappedRoles.length > 0 ? mappedRoles : initialRoles.roles;

        setRoles((current) => ({
          teamSize:
            project.teamSize !== undefined && project.teamSize !== null
              ? String(project.teamSize)
              : current.teamSize,
          roles: mergeRoleLists(current.roles, serverRoles, {
            localIsAuthoritative: hasDraftBackup,
          }),
        }));

        const toDateInputValue = (isoString) => {
          if (!isoString) return "";
          const date = new Date(isoString);
          return Number.isNaN(date.getTime())
            ? ""
            : date.toISOString().slice(0, 10);
        };

        setCommitment({
          duration:
            project.durationWeeks !== undefined &&
            project.durationWeeks !== null
              ? String(project.durationWeeks)
              : "",
          startDate: toDateInputValue(project.startDate),
          endDate: toDateInputValue(project.targetEndDate),
          hoursByRole,
          availability: project.availabilityExpectation ?? "",
          responseExpectation: project.availabilityResponseExpectation ?? "",
        });

        const rawMilestones = Array.isArray(project.milestones)
          ? project.milestones
          : [];
        setMilestones(
          rawMilestones.map((milestone) => ({
            name: milestone.title ?? "",
            date: toDateInputValue(milestone.dueDate),
          })),
        );
      })
      .catch((error) => {
        if (isMounted) {
          setDraftLoadError(error);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDraft(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialDraftId]);

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
    setSaveError(null);
    setSaveFieldErrors({});
  };

  const updateRoles = (updatesOrFn) => {
    setRoles((current) =>
      typeof updatesOrFn === "function"
        ? updatesOrFn(current)
        : { ...current, ...updatesOrFn },
    );
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
    setSaveError(null);
    setSaveFieldErrors({});
  };

  const updateCommitment = (updatesOrFn) => {
    setCommitment((current) =>
      typeof updatesOrFn === "function"
        ? updatesOrFn(current)
        : { ...current, ...updatesOrFn },
    );
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
    setSaveError(null);
    setSaveFieldErrors({});
  };

  const updateMilestones = (updatesOrFn) => {
    setMilestones((current) =>
      typeof updatesOrFn === "function" ? updatesOrFn(current) : updatesOrFn,
    );
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
    setSaveError(null);
    setSaveFieldErrors({});
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

  const saveDraft = async (overrides = {}) => {
    if (saveInFlightRef.current || publishInFlightRef.current) {
      return;
    }

    saveInFlightRef.current = true;
    setSaveError(null);
    setSaveFieldErrors({});
    setSaveStatus("saving");
    try {
      const snapshot = overrides?.nativeEvent ? {} : overrides;
      const data = buildProjectPayload({
        basics: snapshot.basics ?? basics,
        roles: snapshot.roles ?? roles,
        commitment: snapshot.commitment ?? commitment,
        milestones: snapshot.milestones ?? milestones,
      });
      if (draftId) {
        await updateProjectDraft(draftId, data);
      } else {
        const result = await createProjectDraft(data);
        const createdDraftId = result?.project?.id ?? result?.id;
        if (!createdDraftId) {
          throw new Error("Draft creation response did not include an ID");
        }
        locallyCreatedDraftIdRef.current = String(createdDraftId);
        setDraftId(createdDraftId);
        navigate(`/projects/${createdDraftId}/edit`, { replace: true });
      }

      // TODO: Load skills with backend IDs before adding them to the payload.

      setSaveStatus("saved");
    } catch (error) {
      setSaveError(error);
      setSaveFieldErrors(normalizeFieldErrors(error));
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
    setSaveError(null);
    setSaveFieldErrors({});
    setPublishStatus("publishing");
    setSaveStatus("saving");
    let payloadSaved = false;
    try {
      const data = buildProjectPayload({
        basics,
        roles,
        commitment,
        milestones,
      });
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
      clearDraftBackup();
    } catch (error) {
      if (!payloadSaved) {
        setSaveError(error);
        setSaveFieldErrors(normalizeFieldErrors(error));
        setSaveStatus("failed");
      }
      setPublishError(error);
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
    saveError,
    saveFieldErrors,
    publishStatus,
    setPublishStatus,
    publishError,
    publishedProjectId,
    availableSkills,
    skillsLoadStatus,
    skillGroups,
    retrySkills,
    ownerName,
    isLoadingDraft,
    draftLoadError,
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
