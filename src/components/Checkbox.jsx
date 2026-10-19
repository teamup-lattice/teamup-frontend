import { useId } from "react";
import styles from "./Checkbox.module.css";

function Checkbox({ label, helperText, id, ...rest }) {
  const generatedId = useId();
  const checkboxId = id || generatedId;
  const helperId = `${checkboxId}-helper`;

  return (
    <div className={styles.wrapper}>
      <input
        id={checkboxId}
        className={styles.checkbox}
        type="checkbox"
        aria-describedby={helperText ? helperId : undefined}
        {...rest}
      />
      <div className={styles.text}>
        <label className={styles.label} htmlFor={checkboxId}>
          {label}
        </label>
        {helperText && (
          <p id={helperId} className={styles.helper}>
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}

export default Checkbox;
