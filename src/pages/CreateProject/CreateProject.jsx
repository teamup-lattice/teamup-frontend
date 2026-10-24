import { useParams } from "react-router-dom";
import { useContext } from "react";
import Button from "../../components/Button";
import { WizardProvider } from "./WizardContext";
import { WizardContext } from "./WizardContextValue";
import WizardSteps from "./WizardSteps";
import BasicsStep from "./BasicsStep";
import styles from "./CreateProject.module.css";

function WizardContent() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("WizardContent must be used within a WizardProvider.");
  }
  const { currentStep, completedSteps, goBack, goNext } = context;

  return (
    <div className={styles.page}>
      <WizardSteps
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
      <div className={styles.contentCard}>
        {currentStep === 1 ? (
          <BasicsStep />
        ) : (
          <section className={styles.placeholder}>
            <p>
              {currentStep === 2
                ? "Roles step coming next"
                : `${["", "", "Commitment", "Milestones", "Review"][currentStep]} step coming next`}
            </p>
            <div className={styles.placeholderActions}>
              <Button variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button onClick={goNext}>Continue</Button>
            </div>
          </section>
        )}
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
