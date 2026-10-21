import logo from "../assets/teamup-logo.png";
import styles from "./Logo.module.css";

function Logo() {
  return <img className={styles.logo} src={logo} alt="TeamUp" />;
}

export default Logo;
