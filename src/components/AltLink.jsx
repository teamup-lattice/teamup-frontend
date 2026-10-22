import { Link } from "react-router-dom";
import styles from "./AltLink.module.css";

function AltLink({ to, children }) {
  return (
    <Link to={to} className={styles.altLink}>
      {children}
    </Link>
  );
}

export default AltLink;
