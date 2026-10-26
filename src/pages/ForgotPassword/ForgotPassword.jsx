import { useState } from "react";
import AuthLayout from "../../layouts/AuthLayout";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { forgotPassword } from "../../services/authService";
import styles from "./ForgotPassword.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestDescription =
  "Enter the email address associated with your account. We'll send a secure reset link if it matches a registered profile.";

function validate({ email }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address, like name@example.org.";
  }

  return errors;
}

function ForgotPassword() {
  const [values, setValues] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const isLoading = status === "loading";
  const isSent = status === "sent";

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function sendResetLink() {
    setStatus("loading");
    try {
      await forgotPassword({ email: values.email.trim() });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const foundErrors = validate(values);
    setErrors(foundErrors);

    const firstInvalid = ["email"].find((field) => foundErrors[field]);
    if (firstInvalid) {
      document.getElementById(`forgot-password-${firstInvalid}`).focus();
      return;
    }

    await sendResetLink();
  }

  return (
    <AuthLayout
      title={isSent ? "Check your email" : "Reset your password"}
      description={
        isSent
          ? `If ${values.email.trim()} is registered, a reset link will arrive shortly. Check your inbox and spam folder.`
          : requestDescription
      }
      backTo="/login"
      backLabel={
        <>
          <span className={styles.desktopBackLabel}>Back to sign in</span>
          <span className={styles.mobileBackLabel}>Back</span>
        </>
      }
    >
      {isSent ? (
        <>
          <Alert variant="info" title="Email sent">
            If the address is registered, you'll receive a secure reset link
            shortly.
          </Alert>
          <Button fullWidth loading={isLoading} onClick={sendResetLink}>
            Resend email
          </Button>
          <AltLink to="/login">Back to sign in</AltLink>
        </>
      ) : (
        <>
          {status === "error" && (
            <Alert variant="error" title="We could not connect">
              Request not confirmed. Your entry is retained. Try again.
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="forgot-password-email"
              name="email"
              type="email"
              label="Email"
              required
              autoComplete="email"
              placeholder="ada@example.org"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isLoading}
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              loadingText="Sending..."
            >
              Send reset link
            </Button>

            <AltLink to="/login">Back to sign in</AltLink>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
