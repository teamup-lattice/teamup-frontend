import { VISIBILITY_FIELDS } from "../../data/profileData";
import { hasAnyPublic } from "./visibilitySummary";
import styles from "./PublicPreview.module.css";

// Always rendered from the last SAVED visibility, never from the local draft.
function PublicPreview({ visibility, profile }) {
  const anyPublic = hasAnyPublic(visibility);
  const allPublic = VISIBILITY_FIELDS.every((f) => visibility[f.key]);

  const roleAndLevel = [
    visibility.role && profile.role,
    visibility.skillLevel && profile.skillLevel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={styles.preview}>
      <p className={styles.label}>Public preview · read only</p>

      {anyPublic ? (
        <>
          <h3 className={styles.heading}>
            {visibility.name ? profile.name : "Public profile"}
          </h3>
          {roleAndLevel && <p className={styles.line}>{roleAndLevel}</p>}
          {visibility.skills && (
            <p className={styles.line}>{profile.skills.join(" · ")}</p>
          )}
          {visibility.goals && <p className={styles.line}>{profile.goals}</p>}
          {visibility.availability && (
            <p className={styles.line}>
              Availability: {profile.availabilityHours} hours/week
            </p>
          )}
          {visibility.duration && (
            <p className={styles.line}>
              Preferred duration: {profile.durationWeeks} weeks
            </p>
          )}
          {!allPublic && (
            <p className={styles.helper}>No other profile fields are displayed.</p>
          )}
        </>
      ) : (
        <>
          <h3 className={styles.heading}>Profile details are private</h3>
          <p className={styles.line}>
            This person has not chosen to share profile details publicly.
          </p>
        </>
      )}

      <p className={styles.helper}>Contact details are never displayed to visitors.</p>
    </div>
  );
}

export default PublicPreview;
