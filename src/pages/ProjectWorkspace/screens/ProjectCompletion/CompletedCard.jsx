import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./ProjectCompletion.module.css";

// Shown once completion succeeded. Completing never publishes anything:
// the project page is PRIVATE / Team-only and profiles are unchanged.
function CompletedCard({ projectName, memberCount, visibility, audience, onViewPage }) {
  return (
    <section className={shared.card} aria-labelledby="completed-title">
      <div className={styles.successBody}>
        <Alert variant="success" title={`${projectName} completed`}>
          Outcome, at least one deliverable and all {memberCount} member confirmations saved.
        </Alert>
        <h3 id="completed-title" className={shared.text}>
          {visibility}
          {SEP}
          {audience}
        </h3>
        <p className={shared.text}>Profiles remain unchanged.</p>
        <Button variant="secondary" fullWidth onClick={onViewPage}>
          View private project page
        </Button>
      </div>
    </section>
  );
}

export default CompletedCard;
