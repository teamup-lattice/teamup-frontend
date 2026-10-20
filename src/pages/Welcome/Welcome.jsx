import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Logo from "../../components/Logo";
import heroImage from "../../assets/welcome-hero.png";
import styles from "./Welcome.module.css";

const STEPS = [
  { id: "01", title: "Tell us what you bring", text: "Share your skills and availability." },
  { id: "02", title: "Choose a real project", text: "Review the role, hours and deadlines before joining." },
  { id: "03", title: "Build your evidence", text: "Record your contributions." },
];

function Welcome() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const errorRef = useRef(null);

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  function openSignUp() {
    setStatus("loading");
    try {
      navigate("/signup");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <span className={styles.headerLabel}>Welcome</span>
      </header>

      <main className={styles.main}>
        <img className={styles.illustration} src={heroImage} alt="" />

        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Learn a skill. Build with a team.</h1>
          <p className={styles.heroText}>Build a real project with a team.</p>
        </section>

        {status === "error" && (
          <div ref={errorRef} tabIndex={-1} className={styles.errorWrap}>
            <Alert variant="error" title="Could not open account access">
              Account not created. Try opening the form again.
            </Alert>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            fullWidth
            onClick={openSignUp}
            loading={status === "loading"}
            loadingText="Opening account access..."
          >
            {status === "error" ? "Retry opening sign-up" : "Create account"}
          </Button>
          <Button fullWidth variant="secondary" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.id} className={styles.step}>
              <span className={styles.stepNumber}>{step.id}</span>
              <div>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

export default Welcome;
