import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Logo from "../../components/Logo";
import WelcomeArt from "./WelcomeArt";
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
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>From Learning to Building</span>
            <h1 className={styles.heroTitle}>Learn a skill. Build with a team.</h1>
            <p className={styles.heroText}>Build a real project with a team.</p>
          </div>
          <div className={styles.artWrap}>
            <WelcomeArt />
          </div>
        </section>

        <section className={styles.actionsCard} aria-labelledby="get-started">
          <h2 id="get-started" className={styles.cardTitle}>
            Choose how to get started
          </h2>

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
        </section>

        <section className={styles.stepsSection} aria-labelledby="how-it-works">
          <h2 id="how-it-works" className={styles.sectionTitle}>
            How TeamUp works
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step.id} className={styles.step}>
                <span className={styles.badge}>{step.id}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className={styles.privacy}>
          <svg
            className={styles.lock}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          Contact details are visible only to accepted teammates.
        </p>
      </main>
    </div>
  );
}

export default Welcome;
