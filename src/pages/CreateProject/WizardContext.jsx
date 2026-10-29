import { useState } from "react";
import {
  saveDraft as saveDraftService,
  publishProject as publishProjectService,
} from "../../services/projectService";
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
  const [publishedProjectId, setPublishedProjectId] = useState(null);

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
    setCompletedSteps((steps) =>
      steps.filter((step) => step !== stepToReopen),
    );
  };

  const goBack = () => {
    setSaveStatus("idle");
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const saveDraft = async () => {
    if (saveStatus === "saving") {
      return;
    }

    setSaveStatus("saving");
    try {
      const result = await saveDraftService({
        draftId,
        basics,
        roles,
        commitment,
        milestones,
      });
      setDraftId(result.id);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    }
  };

  const publishProject = async () => {
    if (publishStatus === "publishing") {
      return;
    }

    setPublishStatus("publishing");
    try {
      const result = await publishProjectService({
        draftId,
        basics,
        roles,
        commitment,
        milestones,
      });
      setPublishedProjectId(result.id);
      setPublishStatus("published");
    } catch {
      setPublishStatus("failed");
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
    publishedProjectId,
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
