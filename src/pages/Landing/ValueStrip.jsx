import {
  ClipboardCheckIcon,
  FolderCheckIcon,
  UsersIcon,
} from "../../components/Icons";
import styles from "./ValueStrip.module.css";

const values = [
  { label: "Find your team", Icon: UsersIcon },
  { label: "Know your commitment", Icon: ClipboardCheckIcon },
  { label: "Show your contribution", Icon: FolderCheckIcon },
];

function ValueStrip() {
  return (
    <section className={styles.strip} aria-label="TeamUp benefits">
      <div className={styles.container}>
        {values.map(({ label, Icon }) => (
          <div className={styles.item} key={label}>
            <Icon />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ValueStrip;
