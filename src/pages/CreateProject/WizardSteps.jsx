import { useContext } from "react";
import { WizardContext } from "./WizardContextValue";
import styles from "./WizardSteps.module.css";

const steps = ["Basics", "Roles", "Commitment", "Milestones", "Review"];

function WizardSteps({ currentStep, completedSteps }) {
  const context = useContext(WizardContext);
  const currentLabel = steps[currentStep - 1];
  const completedBeforeCurrent = completedSteps.filter(
    (stepNumber) => stepNumber !== currentStep,
  ).length;

  const handleStepClick = (stepNumber) => {
    if (completedSteps.includes(stepNumber) && stepNumber !== currentStep) {
      if (context?.setCurrentStep) {
        context.setCurrentStep(stepNumber);
      }
    }
  };

  return (
    <nav className={styles.navigation} aria-label="Project creation steps">
      <p className={styles.mobileLabel}>
        Step {currentStep} of {steps.length} · {currentLabel}
      </p>
      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          const isCompleted = completedSteps.includes(stepNumber);

          return (
            <li
              key={step}
              className={`${styles.step} ${isCurrent ? styles.current : ""} ${isCompleted && !isCurrent ? styles.completed : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isCompleted && !isCurrent ? (
                <button
                  type="button"
                  className={styles.stepButton}
                  onClick={() => handleStepClick(stepNumber)}
                >
                  <span className={styles.stepNumber}>Step {stepNumber}</span>
                  <span className={styles.stepName}>{step}</span>
                  <span className={styles.visuallyHidden}>completed</span>
                </button>
              ) : (
                <>
                  <span className={styles.stepNumber}>Step {stepNumber}</span>
                  <span className={styles.stepName}>{step}</span>
                  {isCompleted && (
                    <span className={styles.visuallyHidden}>completed</span>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
      <div className={styles.mobileProgress} aria-hidden="true">
        <span
          style={{
            width: `${((completedBeforeCurrent + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
    </nav>
  );
}

export default WizardSteps;
