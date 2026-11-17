import { useId } from "react";
import styles from "./ProjectCompletion.module.css";

// A labelled, non-editable value (used when edits are locked or the viewer is
// not the Owner). Plain text so it grows with its content.
function ReadOnlyBox({ label, children }) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId}>
      <p id={labelId} className={styles.readOnlyLabel}>
        {label}
      </p>
      <p className={styles.readOnlyBox}>{children}</p>
    </div>
  );
}

export default ReadOnlyBox;
