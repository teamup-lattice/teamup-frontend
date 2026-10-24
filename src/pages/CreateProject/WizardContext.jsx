import { useState } from "react";
import { saveDraft as saveDraftService } from "../../services/projectService";
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
  roles: [],
};

export function WizardProvider({ children, initialDraftId = null }) {
  const [draftId, setDraftId] = useState(initialDraftId);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [basics, setBasics] = useState(initialBasics);
  const [roles, setRoles] = useState(initialRoles);
  const [saveStatus, setSaveStatus] = useState("idle");

  const updateBasics = (updates) => {
    setBasics((current) => ({ ...current, ...updates }));
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
  };

  const updateRoles = (updates) => {
    setRoles((current) => ({ ...current, ...updates }));
    setSaveStatus((current) => (current === "saving" ? current : "idle"));
  };

  const goNext = () => {
    if (currentStep >= 5) {
      return;
    }

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
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1));

  const saveDraft = async () => {
    if (saveStatus === "saving") {
      return;
    }

    setSaveStatus("saving");
    try {
      const result = await saveDraftService({ draftId, basics, roles });
      setDraftId(result.id);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    }
  };

  const value = {
    draftId,
    setDraftId,
    currentStep,
    setCurrentStep,
    completedSteps,
    setCompletedSteps,
    basics,
    setBasics: updateBasics,
    roles,
    setRoles: updateRoles,
    saveStatus,
    setSaveStatus,
    goNext,
    goBack,
    markStepIncomplete,
    saveDraft,
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
