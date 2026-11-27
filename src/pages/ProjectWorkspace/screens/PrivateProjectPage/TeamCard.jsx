import AvatarGroup from "../../../../components/AvatarGroup";
import { formatDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./PrivateProjectPage.module.css";

function TeamCard({ team }) {
  return (
    <section className={shared.card} aria-labelledby="page-team-title">
      <h3 id="page-team-title" className={shared.cardTitle}>
        The team
      </h3>
      <ul className={styles.teamList}>
        {team.members.map((member) => (
          <li key={member.name} className={styles.teamMember}>
            <AvatarGroup
              hidden
              items={[{ initial: member.name.charAt(0), label: member.name }]}
            />
            <span className={styles.teamMeta}>
              <span className={styles.teamName}>{member.name}</span>
              <span className={styles.teamRole}>{member.role}</span>
            </span>
          </li>
        ))}
      </ul>
      {team.joinedOn && (
        <p className={styles.teamFooter}>
          All joined {formatDate(team.joinedOn)}
        </p>
      )}
    </section>
  );
}

export default TeamCard;
