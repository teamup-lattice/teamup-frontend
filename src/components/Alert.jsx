import styles from "./Alert.module.css";

const icons = {
  error: "!",
  info: "i",
  success: "✓",
  warning: "!",
};

function Alert({ variant = "error", title, children }) {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div className={`${styles.alert} ${styles[variant]}`} role={role}>
      <span className={styles.icon} aria-hidden="true">
        {icons[variant]}
      </span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <p className={styles.message}>{children}</p>}
      </div>
    </div>
  );
}

export default Alert;
