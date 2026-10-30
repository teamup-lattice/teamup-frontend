import styles from "./TeamAgreementsCard.module.css";

function TeamAgreementsCard({ agreements, variant }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.title}>Team agreements</h2>
      <ul className={styles.bullets}>
        {agreements.bullets.map((bullet) => (
          <li className={styles.body} key={bullet}>
            {bullet}
          </li>
        ))}
      </ul>
      <div>
        <h3 className={styles.label}>
          {variant === "invitation"
            ? "Response-window proposal"
            : "Response window"}
        </h3>
        <p className={styles.body}>
          {variant === "invitation"
            ? agreements.proposal
            : agreements.commitmentText}
        </p>
        {variant === "invitation" && (
          <p className={styles.mutedLine}>{agreements.note}</p>
        )}
      </div>
    </article>
  );
}

export default TeamAgreementsCard;
