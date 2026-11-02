import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import styles from "./StateNotice.module.css";

function StateNotice({
  variant = "info",
  title,
  text,
  buttonLabel,
  onButtonClick,
  buttonVariant = "primary",
  children,
}) {
  return (
    <div className={styles.notice}>
      <Alert variant={variant} title={title}>
        {text}
      </Alert>
      {children}
      {buttonLabel && (
        <Button variant={buttonVariant} onClick={onButtonClick} fullWidth>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}

export default StateNotice;
