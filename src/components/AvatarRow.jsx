import styles from "./AvatarRow.module.css";

function AvatarRow({ initial, text }) {
  return (
    <div className={styles.row}>
      <span className={styles.avatar} aria-hidden="true">
        {initial}
      </span>
      <span className={styles.text}>{text}</span>
    </div>
  );
}

export default AvatarRow;
