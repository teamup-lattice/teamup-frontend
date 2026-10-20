import styles from "./Button.module.css";

function Button({
  children,
  variant = "primary",
  type = "button",
  loading = false,
  loadingText = "Please wait...",
  disabled = false,
  fullWidth = false,
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
