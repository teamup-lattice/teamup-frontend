import shared from "../shared.module.css";
import EvidenceLink from "./EvidenceLink";
import styles from "./PrivateProjectPage.module.css";

function DeliverablesCard({ deliverables }) {
  return (
    <section className={shared.card} aria-labelledby="page-deliverables-title">
      <h3 id="page-deliverables-title" className={shared.cardTitle}>
        Project deliverables
      </h3>
      <p className={shared.small}>Project evidence</p>
      {deliverables.length === 0 ? (
        <p className={shared.text}>No saved project deliverable.</p>
      ) : (
        deliverables.map((item) => (
          <EvidenceLink key={item.name} evidence={item} className={styles.fileLink}>
            {item.name}
          </EvidenceLink>
        ))
      )}
      <p className={shared.small}>Saved project deliverable</p>
      <p className={shared.helper}>
        Completion requires at least one link OR file, not two.
      </p>
    </section>
  );
}

export default DeliverablesCard;
