import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { invitationId } from "../../data/collaborationData";
import styles from "./PendingInvitationCard.module.css";

function PendingInvitationCard({ pendingInvitation }) {
  const navigate = useNavigate();

  return (
    <article className={styles.card}>
      <span className={styles.status}>Pending response</span>
      <h3 className={styles.title}>{pendingInvitation.title}</h3>
      <p className={styles.description}>{pendingInvitation.description}</p>
      <p className={styles.meta}>
        {pendingInvitation.role} · {pendingInvitation.hoursPerWeek}{" "}
        {pendingInvitation.hoursPerWeek === 1 ? "hour" : "hours"}/week ·{" "}
        {pendingInvitation.weeks}{" "}
        {pendingInvitation.weeks === 1 ? "week" : "weeks"}
      </p>
      <Button onClick={() => navigate(`/invitations/${invitationId}`)}>
        Review invitation
      </Button>
      <p className={styles.helper}>
        Review your commitment. No workspace access until acceptance is saved.
      </p>
    </article>
  );
}

export default PendingInvitationCard;
