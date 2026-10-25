import { Link } from "react-router-dom";
import { ArrowDownIcon, LightbulbIcon } from "../../components/Icons";
import heroImage from "../../assets/landing-hero.png";
import { GET_STARTED_PATH } from "./landingConfig";
import styles from "./Hero.module.css";

function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.container}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Make something together</p>
          <h1 id="landing-hero-title" className={styles.heading}>
            <span>Learn a skill.</span>
            <span className={styles.headingAccent}>
              Build with
              <br />
              a team.
            </span>
          </h1>
          <p className={styles.description}>
            Turn what you know into something real. Find a project, agree on
            your commitment, and build with people who bring different skills.
          </p>
          <div className={styles.actions}>
            <Link to={GET_STARTED_PATH} className={styles.getStarted}>
              Get Started
            </Link>
            <a className={styles.seeHow} href="#how-it-works">
              See how it works
              <ArrowDownIcon />
            </a>
          </div>
          <p className={styles.note}>
            Start with TeamUp. Create an account or sign in.
          </p>
        </div>

        <div className={styles.visual}>
          <img className={styles.heroImage} src={heroImage} alt="" />
          <div className={styles.topChip}>
            <LightbulbIcon />
            <span>Real projects. Shared purpose.</span>
          </div>
          <div className={styles.bottomCard}>
            <div className={styles.avatars} aria-hidden="true">
              <span>A</span>
              <span>D</span>
              <span>J</span>
            </div>
            <div>
              <p className={styles.cardTitle}>Different skills. One team.</p>
              <p className={styles.cardText}>A place to learn by building.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
