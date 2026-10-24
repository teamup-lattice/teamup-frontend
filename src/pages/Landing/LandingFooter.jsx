import { Link } from "react-router-dom";
import Logo from "../../components/Logo";
import styles from "./LandingFooter.module.css";

function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <Link to="/" className={styles.logo} aria-label="TeamUp home">
            <Logo />
          </Link>
          <nav className={styles.navigation} aria-label="Footer">
            <a href="#how-it-works">How it works</a>
            <a href="#discover-projects">Discover projects</a>
            <a href="#build-together">Build together</a>
          </nav>
          <p className={styles.tagline}>Learn a skill. Build with a team.</p>
        </div>
        <div className={styles.bottomRow}>
          <span>TeamUp</span>
          <span>Real projects. Clear commitments. Shared progress.</span>
          <span>Copyright 2026</span>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
