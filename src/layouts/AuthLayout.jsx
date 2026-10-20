import { Link } from "react-router-dom";
import logo from "../assets/teamup-logo.png";
import styles from "./AuthLayout.module.css";

function AuthLayout({
  backTo = "/",
  backLabel = "Back",
  step,
  title,
  description,
  children,
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="TeamUp" className={styles.logoImage} />
        </Link>
        <Link to={backTo} className={styles.back}>
          {backLabel}
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          {step && <p className={styles.step}>{step}</p>}
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
