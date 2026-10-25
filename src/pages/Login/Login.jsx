import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { signIn } from "../../services/authService";
import styles from "./Login.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address, like name@example.org.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

function Login() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [user, setUser] = useState(null);

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

    const firstInvalid = ["email", "password"].find(
      (field) => foundErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`).focus();
      return;
    }

    setStatus("loading");
    try {
      const result = await signIn(values);
      setUser(result);
      setStatus("success");
    } catch (error) {
      setStatus(error.code === "INVALID_CREDENTIALS" ? "invalid" : "error");
    }
  }

  if (status === "success") {
    const complete = user.profileComplete;

    return (
      <AuthLayout
        title="Welcome back"
        description="Sign in to pick up where you left off."
        backTo="/welcome"
        backLabel={
          <>
            <span className={styles.desktopBackLabel}>Back to welcome</span>
            <span className={styles.mobileBackLabel}>Back</span>
          </>
        }
      >
        <Alert variant="success" title="Signed in">
          {complete
            ? `Welcome back, ${user.name}. Your required profile is complete.`
            : `Welcome back, ${user.name}. Finish your required profile to continue.`}
        </Alert>
        <h2 className={styles.nextTitle}>Your next step</h2>
        <p className={styles.nextText}>
          {complete
            ? "View your projects and tasks."
            : "Tell us what you bring so we can match you to projects."}
        </p>
        <Button
          fullWidth
          onClick={() => navigate(complete ? "/projects" : "/profile/setup")}
        >
          {complete ? "Open dashboard" : "Continue required profile"}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to pick up where you left off."
      backTo="/welcome"
      backLabel={
        <>
          <span className={styles.desktopBackLabel}>Back to welcome</span>
          <span className={styles.mobileBackLabel}>Back</span>
        </>
      }
    >
      {status === "invalid" && (
        <Alert variant="error" title="Email or password is incorrect">
          Check your details and try again. You have not been signed in.
        </Alert>
      )}
      {status === "error" && (
        <Alert variant="error" title="We could not connect">
          Sign-in not confirmed. Your entries are retained. Try again.
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="login-email"
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
          id="login-password"
          name="password"
          type="password"
          label="Password"
          required
          helperText="Use a password you do not use elsewhere."
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isLoading}
        />

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          loadingText="Checking credentials..."
        >
          {status === "error" ? "Try again" : "Sign in"}
        </Button>

        <AltLink to="/signup">Create account</AltLink>
      </form>
    </AuthLayout>
  );
}

export default Login;
