import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { signOut } from "../../services/authService";
import { getSettings, requestAccountDeletion } from "../../services/settingsService";
import styles from "./Settings.module.css";

const SEPARATE_NOTE =
  "Notification and profile settings remain separate from this account request.";

function AccountDeletion() {
  const navigate = useNavigate();
  const [accountName, setAccountName] = useState(null);
  const [nameStatus, setNameStatus] = useState("loading"); // loading | ready | error
  const [status, setStatus] = useState("confirm"); // confirm | submitting | error | received
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((settings) => {
        if (!isMounted) return;
        setAccountName(settings.name);
        setNameStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load account name:", error);
        if (isMounted) setNameStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleConfirm() {
    setStatus("submitting");
    try {
      await requestAccountDeletion();
      setStatus("received");
    } catch (error) {
      console.error("Failed to send deletion request:", error);
      setStatus("error");
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      // signOut clears the local token even when the request fails.
      console.error("Sign out request failed:", error);
    }
    navigate("/login");
  }

  const accountLine = (
    <p className={styles.fieldText}>
      Account:{" "}
      {nameStatus === "loading"
        ? "…"
        : nameStatus === "error"
          ? "not available"
          : accountName}
    </p>
  );

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.heading}>Account deletion</h1>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link to="/settings" className={styles.textLink}>
            Settings
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Account controls</span>
        </nav>
      </div>

      {status === "received" ? (
        <div className={styles.deletionBody}>
          <Alert variant="success" title="Deletion request received">
            Your request has been submitted. This is not confirmation that your
            account is deleted.
          </Alert>
          {accountLine}
          <div className={styles.buttonStack}>
            <Button onClick={() => navigate("/settings")}>Back to Settings</Button>
            <Button
              variant="neutral"
              loading={isSigningOut}
              loadingText="Signing out…"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
          <p className={styles.helper}>{SEPARATE_NOTE}</p>
        </div>
      ) : (
        <div className={styles.deletionBody}>
          {status === "error" && (
            <Alert variant="error" title="Deletion request didn't send">
              Your account has not been deleted. Please try again.
            </Alert>
          )}
          <section
            className={styles.card}
            aria-labelledby="deletion-heading"
          >
            <h2 className={styles.cardTitle} id="deletion-heading">
              Request account deletion?
            </h2>
            <p className={styles.fieldText}>
              This sends a request to delete your TeamUp account. Your account
              has not been deleted.
            </p>
            {accountLine}
            <p className={styles.fieldText}>
              No request is sent until you confirm.
            </p>
            <div className={styles.buttonRow}>
              <Button
                variant="neutral"
                disabled={status === "submitting"}
                onClick={() => navigate("/settings")}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={status === "submitting"}
                loadingText="Sending request…"
                onClick={handleConfirm}
              >
                Confirm request
              </Button>
            </div>
          </section>
          <p className={styles.helper}>{SEPARATE_NOTE}</p>
        </div>
      )}
    </div>
  );
}

export default AccountDeletion;
