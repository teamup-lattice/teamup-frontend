import { Link } from "react-router-dom";
import Input from "../../components/Input";
import styles from "./Settings.module.css";

function ProfileDataCard({ values, disabled, onChange }) {
  return (
    <div className={styles.column}>
      <section className={styles.card} aria-labelledby="profile-data-heading">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle} id="profile-data-heading">
            Profile data
          </h2>
          <p className={styles.cardDescription}>Keep your details up to date.</p>
        </div>

        <div>
          <Input
            label="Name"
            name="name"
            autoComplete="name"
            value={values.name}
            disabled
          />
          <Input
            label="Goals"
            name="goals"
            multiline
            placeholder="Add your goals"
            value={values.goals}
            disabled={disabled}
            onChange={onChange}
          />
        </div>

        <div className={styles.skillsLink}>
          <Link to="/profile/setup" className={styles.textLink}>
            Edit skills profile
          </Link>
          <p className={styles.helper}>
            Opens your approved Skills Profile form for skills, availability and
            preferred duration.
          </p>
        </div>
      </section>

      <p className={styles.helper}>
        No new skill categories here. Edit your skills and commitment in the
        shared Skills Profile form.
      </p>
    </div>
  );
}

export default ProfileDataCard;
