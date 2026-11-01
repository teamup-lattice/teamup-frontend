import styles from "./Skeleton.module.css";

function Skeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.titleBar} />
      <div className={styles.bodyBar} />
    </div>
  );
}

export default Skeleton;
