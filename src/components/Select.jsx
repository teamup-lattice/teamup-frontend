import { useId } from "react";
import inputStyles from "./Input.module.css";
import styles from "./Select.module.css";

function Select({
  label,
  options = [],
  placeholder = "Select an option",
  helperText,
  error,
  required = false,
  id,
  ...rest
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  const describedBy =
    [helperText ? helperId : "", error ? errorId : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  const selectClasses = [
    inputStyles.input,
    styles.select,
    error ? inputStyles.inputError : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={inputStyles.field}>
      <label className={inputStyles.label} htmlFor={selectId}>
        {label}
        {required && <span className={inputStyles.required}> *</span>}
      </label>

      <div className={inputStyles.control}>
        <select
          id={selectId}
          className={selectClasses}
          aria-required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow} aria-hidden="true" />
      </div>

      {helperText && (
        <p id={helperId} className={inputStyles.helper}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className={inputStyles.error}>
          <span className={inputStyles.errorIcon} aria-hidden="true">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;
