import { useParams } from "react-router-dom";
import { useContext } from "react";
import { WizardProvider } from "./WizardContext";
import { WizardContext } from "./WizardContextValue";
import WizardSteps from "./WizardSteps";
import BasicsStep from "./BasicsStep";
import RolesStep from "./RolesStep";
import CommitmentStep from "./CommitmentStep";
import MilestonesStep from "./MilestonesStep";
import ReviewStep from "./ReviewStep";
import PublishedView from "./PublishedView";
import styles from "./CreateProject.module.css";

function WizardContent() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("WizardContent must be used within a WizardProvider.");
  }
  const { currentStep, completedSteps, publishStatus } = context;

  if (publishStatus === "published") {
    return (
      <div className={styles.page}>
        <div className={styles.contentCard}>
          <PublishedView />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <WizardSteps
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
      <div className={styles.contentCard}>
        {currentStep === 1 && <BasicsStep />}
        {currentStep === 2 && <RolesStep />}
        {currentStep === 3 && <CommitmentStep />}
        {currentStep === 4 && <MilestonesStep />}
        {currentStep === 5 && <ReviewStep />}
      </div>
    </div>
  );
}

function CreateProject() {
  const { id } = useParams();

  return (
    <WizardProvider initialDraftId={id ?? null}>
      <WizardContent />
    </WizardProvider>
  );
}

export default CreateProject;
