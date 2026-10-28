import { useId, useState } from "react";
import styles from "./Input.module.css";

function Input({
  label,
  type = "text",
  helperText,
  error,
  required = false,
  multiline = false,
  labelAction,
  id,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const describedBy =
    [helperText ? helperId : "", error ? errorId : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  const inputClasses = [
    styles.input,
    error ? styles.inputError : "",
    isPassword ? styles.hasToggle : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
        {labelAction}
      </div>

      <div className={styles.control}>
        {multiline ? (
          <textarea
            id={inputId}
            className={`${inputClasses} ${styles.textarea}`}
            aria-required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            {...rest}
          />
        ) : (
          <input
            id={inputId}
            className={inputClasses}
            type={inputType}
            aria-required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            {...rest}
          />
        )}
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {helperText && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          <span className={styles.errorIcon} aria-hidden="true">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
