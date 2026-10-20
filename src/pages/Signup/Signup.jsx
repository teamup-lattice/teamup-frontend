import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { signUp } from "../../services/authService";
import styles from "./Signup.module.css";
import AltLink from "../../components/AltLink";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, password }) {
  const errors = {};

  if (!name.trim()) {
    errors.name = "Enter your name.";
  }

  if (!email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address, like name@example.org.";
  }

  if (!password) {
    errors.password = "Create a password.";
  } else if (password.length < 8) {
    errors.password = "Use at least 8 characters for your password.";
  } else if (new TextEncoder().encode(password).length > 72) {
    errors.password = "Use a shorter password.";
  }

  return errors;
}

function Signup() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const isLoading = status === "loading";

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const foundErrors = validate(values);
    setErrors(foundErrors);

    const firstInvalid = ["name", "email", "password"].find(
      (field) => foundErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(`signup-${firstInvalid}`).focus();
      return;
    }

    setStatus("loading");
    try {
      await signUp({ ...values, name: values.name.trim() });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.signupPage}>
        <AuthLayout
          step="Step 1 of 2 · Account"
          title="Your account is created"
          description="Next: complete your required profile."
          backTo="/"
          backLabel={
            <>
              <span className={styles.desktopBackLabel}>Back to welcome</span>
              <span className={styles.mobileBackLabel}>Back</span>
            </>
          }
        >
          <div className={`${styles.banner} ${styles.success}`} role="status">
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16 9" />
            </svg>
            <div className={styles.content}>
              <p className={styles.title}>Account created</p>
              <p className={styles.message}>
                {values.name} · {values.email}. Your required profile is the
                next step.
              </p>
            </div>
          </div>
          <Button fullWidth onClick={() => navigate("/profile")}>
            Set up required profile
          </Button>
          <AltLink to="/login">Sign in instead</AltLink>
        </AuthLayout>
      </div>
    );
  }

  return (
    <div className={styles.signupPage}>
      <AuthLayout
        step="Step 1 of 2 · Account"
        title="Create your account"
        description="Create your account, then complete your profile."
        backTo="/"
        backLabel={
          <>
            <span className={styles.desktopBackLabel}>Back to welcome</span>
            <span className={styles.mobileBackLabel}>Back</span>
          </>
        }
      >
        {status === "error" && (
          <div className={`${styles.banner} ${styles.error}`} role="alert">
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5m0 3h.01" />
            </svg>
            <div className={styles.content}>
              <p className={styles.title}>We could not connect</p>
              <p className={styles.message}>
                Account creation not confirmed. Your other entries are retained.
                Try again.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="signup-name"
            name="name"
            label="Name"
            required
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            disabled={isLoading}
          />
          <Input
            id="signup-email"
            name="email"
            type="email"
            label="Email"
            required
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
          />
          <Input
            id="signup-password"
            name="password"
            type="password"
            label="Password"
            required
            autoComplete="new-password"
            helperText="Use a password you do not use elsewhere."
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
          />

          <p className={styles.note}>
            Contact details are visible only to accepted teammates.
          </p>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            loadingText="Creating account..."
          >
            {status === "error" ? "Try again" : "Create account"}
          </Button>

          <AltLink to="/login">Sign in instead</AltLink>

          {isLoading && (
            <p className={styles.note} role="status">
              Creating your account. Your entries are retained.
            </p>
          )}
        </form>
      </AuthLayout>
    </div>
  );
}

export default Signup;
