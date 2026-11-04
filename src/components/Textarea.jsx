import { useId } from "react";
import styles from "./Textarea.module.css";

function Textarea({ label, id, helperText, error, required, rows = 3, ...rest }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [helperText && helperId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={fieldId}
        className={`${styles.textarea}${error ? ` ${styles.invalid}` : ""}`}
        rows={rows}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {helperText && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

export default Textarea;
