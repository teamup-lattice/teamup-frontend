import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { resetPassword } from "../../services/authService";
import styles from "./ResetPassword.module.css";

const passwordPolicyError =
  "This password does not meet the password policy. Choose a stronger password.";
const passwordMismatchError = "Passwords do not match.";

function validate({ password, confirmPassword }) {
  const errors = {};

  if (!password) {
    errors.password = "Create a password.";
  } else if (
    password.length < 8 ||
    new TextEncoder().encode(password).length > 72
  ) {
    errors.password = passwordPolicyError;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = passwordMismatchError;
  }

  return errors;
}

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [requestState, setRequestState] = useState({
    token,
    status: token ? "idle" : "expired",
  });

  const status =
    requestState.token === token
      ? requestState.status
      : token
        ? "idle"
        : "expired";
  const isLoading = status === "loading";
  const isExpired = status === "expired" || !token;
  const isSuccess = status === "success";

  function updateStatus(nextStatus) {
    setRequestState({ token, status: nextStatus });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const foundErrors = validate(values);
    setErrors(foundErrors);

    const firstInvalid = ["password", "confirmPassword"].find(
      (field) => foundErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(`reset-password-${firstInvalid}`).focus();
      return;
    }

    updateStatus("loading");
    try {
      await resetPassword({ token, password: values.password });
      updateStatus("success");
    } catch (error) {
      updateStatus(error.code === "INVALID_TOKEN" ? "expired" : "error");
    }
  }

  const title = isExpired
    ? "Reset link expired"
    : isSuccess
      ? "Password reset complete"
      : "Create a new password";
  const description = isExpired
    ? "This password reset link is no longer valid. Request a new link to continue."
    : isSuccess
      ? "Your password has been updated. Use it the next time you sign in."
      : "Choose a password you do not use elsewhere. This link expires after one use.";

  return (
    <AuthLayout
      title={title}
      description={description}
      backTo="/login"
      backLabel={
        <>
          <span className={styles.desktopBackLabel}>Back to sign in</span>
          <span className={styles.mobileBackLabel}>Back</span>
        </>
      }
    >
      {isExpired ? (
        <>
          <Alert variant="error" title="Reset link expired">
            This link can no longer be used. Request a new reset email to
            continue.
          </Alert>
          <Button fullWidth onClick={() => navigate("/forgot-password")}>
            Request new reset link
          </Button>
          <AltLink to="/login">Back to sign in</AltLink>
        </>
      ) : isSuccess ? (
        <>
          <Alert variant="success" title="Password updated">
            You can now sign in with your new password.
          </Alert>
          <Button fullWidth onClick={() => navigate("/login")}>
            Return to sign in
          </Button>
        </>
      ) : (
        <>
          {status === "error" && (
            <Alert variant="error" title="We could not connect">
              Password update not confirmed. Your entries are retained. Try
              again.
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="reset-password-password"
              name="password"
              type="password"
              label="New password"
              required
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
            />
            <Input
              id="reset-password-confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              required
              helperText="Use the same password you entered above."
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={isLoading}
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              loadingText="Updating..."
            >
              Update password
            </Button>

            <AltLink to="/login">Back to sign in</AltLink>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
