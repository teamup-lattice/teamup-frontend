import { Link } from "react-router-dom";
import ctaImage from "../../assets/landing-cta.png";
import { GET_STARTED_PATH } from "./landingConfig";
import styles from "./FinalCta.module.css";
import useReveal from "./useReveal";

function FinalCta() {
  const bandReveal = useReveal();
  const eyebrowReveal = useReveal();
  const headingReveal = useReveal();
  const descriptionReveal = useReveal();

  return (
    <section className={styles.section} aria-labelledby="final-cta-title">
      <div className={styles.container}>
        <div className={styles.band} ref={bandReveal}>
          <div className={styles.copy}>
            <p className={styles.eyebrow} ref={eyebrowReveal}>
              Make something together
            </p>
            <h2
              id="final-cta-title"
              className={styles.heading}
              ref={headingReveal}
            >
              Bring your skills. Find your team.
            </h2>
            <p className={styles.description} ref={descriptionReveal}>
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
