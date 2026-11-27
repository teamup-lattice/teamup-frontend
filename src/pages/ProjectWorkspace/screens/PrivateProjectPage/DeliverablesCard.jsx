import { ArrowUpRightIcon, PaperclipIcon } from "../../../../components/Icons";
import shared from "../shared.module.css";
import EvidenceLink from "./EvidenceLink";
import styles from "./PrivateProjectPage.module.css";

function EvidenceIcon({ kind }) {
  return kind === "link" ? <ArrowUpRightIcon /> : <PaperclipIcon />;
}

function DeliverablesCard({ deliverables }) {
  return (
    <section className={shared.card} aria-labelledby="page-deliverables-title">
      <h3 id="page-deliverables-title" className={shared.cardTitle}>
        Project deliverables
      </h3>

      <p className={styles.deliverableLabel}>Project evidence</p>
      <p className={styles.deliverableHelper}>
        Files and links saved when the project was completed.
      </p>

      {deliverables.length === 0 ? (
        <p className={styles.bodyText}>No saved project deliverable.</p>
      ) : (
        <div className={styles.deliverableList}>
          {deliverables.map((item, index) => (
            <EvidenceLink
              key={item.id ?? `${item.title}-${index}`}
              evidence={item}
              className={styles.fileLink}
            >
              <span className={styles.fileLinkIcon}>
                <EvidenceIcon kind={item.kind} />
              </span>
              <span className={styles.fileLinkText}>{item.name}</span>
              <span className={styles.fileLinkArrow} aria-hidden="true">
                <ArrowUpRightIcon />
              </span>
            </EvidenceLink>
          ))}
        </div>
      )}

      <p className={styles.infoNote}>
        Completion requires at least one link OR file, not two.
      </p>
    </section>
  );
}

export default DeliverablesCard;
