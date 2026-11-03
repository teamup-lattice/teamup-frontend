import listFilterIcon from "../assets/list-filter.svg";
import styles from "./EmptyState.module.css";

function EmptyState({ title, text, children }) {
  return (
    <section className={styles.emptyState}>
      <img className={styles.icon} src={listFilterIcon} alt="" />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{text}</p>
      {children && <div className={styles.children}>{children}</div>}
    </section>
  );
}

export default EmptyState;
