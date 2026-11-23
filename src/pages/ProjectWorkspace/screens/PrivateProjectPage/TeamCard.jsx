import { formatDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./PrivateProjectPage.module.css";

function TeamCard({ team }) {
  return (
    <section className={shared.card} aria-labelledby="page-team-title">
      <h3 id="page-team-title" className={shared.cardTitle}>
        The team
      </h3>
      <div className={styles.avatars}>
        {team.members.map((member) => (
          <span key={member.name} className={shared.avatar} aria-hidden="true">
            {member.name.charAt(0)}
          </span>
        ))}
      </div>
      <ul className={shared.list}>
        {team.members.map((member) => (
          <li key={member.name}>
            <p className={styles.memberName}>{member.name}</p>
            <p className={styles.memberRole}>{member.role}</p>
          </li>
        ))}
      </ul>
      {team.joinedOn && (
        <p className={shared.small}>All joined {formatDate(team.joinedOn)}.</p>
      )}
    </section>
  );
}

export default TeamCard;
