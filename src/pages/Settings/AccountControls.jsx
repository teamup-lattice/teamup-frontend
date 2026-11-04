import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { signOut } from "../../services/authService";
import styles from "./Settings.module.css";

function AccountControls() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return (
    <section className={styles.accountControls} aria-labelledby="account-heading">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle} id="account-heading">
          Account controls
        </h2>
        <p className={styles.cardDescription}>
          You&apos;re in control of your account.
        </p>
      </div>

      <div className={styles.accountAction}>
        <Button
          variant="danger"
          onClick={() => navigate("/settings/account-deletion")}
        >
          Request account deletion
        </Button>
        <p className={styles.helper}>
          You&apos;ll review and confirm before a request is sent.
        </p>
      </div>

      <div>
        <Button
          variant="neutral"
          loading={isSigningOut}
          loadingText="Signing out…"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </section>
  );
}

export default AccountControls;
