import { Link } from "react-router-dom";
import ctaImage from "../../assets/landing-cta.png";
import { GET_STARTED_PATH } from "./landingConfig";
import styles from "./FinalCta.module.css";

function FinalCta() {
  return (
    <section className={styles.section} aria-labelledby="final-cta-title">
      <div className={styles.container}>
        <div className={styles.band}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Make something together</p>
            <h2 id="final-cta-title" className={styles.heading}>
              Bring your skills. Find your team.
            </h2>
            <p className={styles.description}>
              Your next step is a real project, a clear commitment and a team
              to build with.
            </p>
            <div className={styles.actions}>
              <Link to={GET_STARTED_PATH} className={styles.getStarted}>
                Get Started
              </Link>
              <span>Create an account or sign in to begin.</span>
            </div>
          </div>
          <img src={ctaImage} alt="" className={styles.image} />
        </div>
      </div>
    </section>
  );
}

export default FinalCta;
