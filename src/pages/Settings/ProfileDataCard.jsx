import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { removeAvatar, uploadAvatar } from "../../services/settingsService";
import styles from "./Settings.module.css";

function ProfileDataCard({ values, disabled, onChange }) {
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [removeError, setRemoveError] = useState(null);
  const fileInputRef = useRef(null);

  const avatarUrl =
    uploadedAvatarUrl !== null ? uploadedAvatarUrl : (values.avatarUrl ?? "");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image must be 2MB or smaller.");
      return;
    }

    setUploadError(null);
    setRemoveError(null);
    setIsConfirmingRemove(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const fileUrl = await uploadAvatar(file);
      setUploadedAvatarUrl(fileUrl);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setUploadError(err.message || "Failed to upload photo");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemovePhoto = async () => {
    setIsRemoving(true);
    setRemoveError(null);
    try {
      await removeAvatar();
      setUploadedAvatarUrl("");
      setPreviewUrl(null);
      setIsConfirmingRemove(false);
    } catch (err) {
      console.error("Avatar remove failed:", err);
      setRemoveError(err.message || "Failed to remove photo");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className={styles.column}>
      <section className={styles.card} aria-labelledby="profile-data-heading">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle} id="profile-data-heading">
            Profile data
          </h2>
          <p className={styles.cardDescription}>Keep your details up to date.</p>
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.avatarPreviewWrapper}>
            {previewUrl || avatarUrl ? (
              <img
                src={previewUrl || avatarUrl}
                alt=""
                className={styles.avatarPreviewImg}
              />
            ) : (
              <span className={styles.avatarPreviewFallback} aria-hidden="true">
                {(values.name || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className={styles.avatarUploadControls}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={handleFileChange}
              disabled={disabled || isUploading || isRemoving}
              aria-label="Upload photo file input"
            />
            <div className={styles.avatarActions}>
              <Button
                type="button"
                variant="secondary"
                loading={isUploading}
                loadingText="Uploading photo..."
                disabled={disabled || isUploading || isRemoving}
                onClick={() => {
                  setRemoveError(null);
                  setIsConfirmingRemove(false);
                  fileInputRef.current?.click();
                }}
              >
                Upload photo
              </Button>
              {Boolean(avatarUrl) && !isConfirmingRemove && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={disabled || isUploading || isRemoving}
                  onClick={() => {
                    setUploadError(null);
                    setRemoveError(null);
                    setIsConfirmingRemove(true);
                  }}
                >
                  Remove photo
                </Button>
              )}
            </div>

            {Boolean(avatarUrl) && isConfirmingRemove && (
              <div className={styles.removeConfirm}>
                <p className={styles.removePrompt}>Remove your photo?</p>
                <div className={styles.removeActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isRemoving}
                    onClick={() => {
                      setIsConfirmingRemove(false);
                      setRemoveError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    loading={isRemoving}
                    loadingText="Removing..."
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </Button>
                </div>
                {removeError && (
                  <Alert variant="error" title="Remove failed">
                    {removeError}
                  </Alert>
                )}
              </div>
            )}

            <p className={styles.helper}>Image types only, max 2MB.</p>
          </div>
        </div>

        {uploadError && (
          <Alert variant="error" title="Photo upload error">
            {uploadError}
          </Alert>
        )}

        <div>
          <Input
            label="Name"
            name="name"
            autoComplete="name"
            value={values.name ?? ""}
            error={values.nameError}
            maxLength={100}
            disabled={disabled}
            onChange={onChange}
          />
          <Input
            label="Goals"
            name="goals"
            multiline
            placeholder="Add your goals"
            value={values.goals}
            disabled={disabled}
            onChange={onChange}
          />
        </div>

        <div className={styles.skillsLink}>
          <Link to="/profile/setup" className={styles.textLink}>
            Edit skills profile
          </Link>
          <p className={styles.helper}>
            Opens your approved Skills Profile form for skills, availability and
            preferred duration.
          </p>
        </div>
      </section>

      <p className={styles.helper}>
        No new skill categories here. Edit your skills and commitment in the
        shared Skills Profile form.
      </p>
    </div>
  );
}

export default ProfileDataCard;
