import styles from "./FieldError.module.css";

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return (
    <p className={styles.error}>
      <span className={styles.icon} aria-hidden="true">
        !
      </span>
      {children}
    </p>
  );
}

export default FieldError;
