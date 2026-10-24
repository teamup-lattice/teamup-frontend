import { Link } from "react-router-dom";
import Logo from "../../components/Logo";
import { GET_STARTED_PATH, SIGN_IN_PATH } from "./landingConfig";
import styles from "./LandingHeader.module.css";

function LandingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo} aria-label="TeamUp home">
            <Logo />
          </Link>
          <nav className={styles.navigation} aria-label="Main">
            <a href="#how-it-works">How it works</a>
            <a href="#discover-projects">Discover projects</a>
            <a href="#why-teamup">Why TeamUp</a>
          </nav>
        </div>
        <div className={styles.actions}>
          <Link to={SIGN_IN_PATH} className={styles.signIn}>
            Sign in
          </Link>
          <Link to={GET_STARTED_PATH} className={styles.getStarted}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default LandingHeader;
