import Checkbox from "../../components/Checkbox";
import { notificationGroups, onOff } from "./notificationOptions";
import styles from "./Settings.module.css";

function NotificationsCard({
  values,
  savedValues,
  hasSavedPreferences,
  saveStatus,
  disabled,
  onToggle,
}) {
  let footerText = "Changes apply after you save.";
  if (saveStatus === "saving" || saveStatus === "error") {
    footerText =
      "Your previous saved preferences stay active until this save succeeds.";
  } else if (!hasSavedPreferences) {
    footerText = "Default choices · Not saved yet.";
  }

  return (
    <section className={styles.card} aria-labelledby="notifications-heading">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle} id="notifications-heading">
          Notifications
        </h2>
        <p className={styles.cardDescription}>
          Choose each kind of in-app notification. On means enabled.
        </p>
      </div>

      {notificationGroups.map((group) => (
        <div key={group.title} className={styles.cardHeader}>
          <h3>{group.title}</h3>
          <ul className={styles.notificationList}>
            {group.options.map((option) => {
              const isOn = values[option.key] ?? true;
              const savedVal = savedValues[option.key] ?? true;
              const isUnsaved = hasSavedPreferences && isOn !== savedVal;
              const helperLines = [
                isUnsaved
                  ? `Unsaved: ${onOff(isOn)} · Previously saved: ${onOff(savedVal)}`
                  : null,
                option.helperText ?? null,
              ].filter(Boolean);

              return (
                <li className={styles.notificationItem} key={option.key}>
                  <Checkbox
                    label={`${option.label} · ${onOff(isOn)}`}
                    helperText={
                      helperLines.length > 0
                        ? helperLines.map((line) => (
                            <span className={styles.helperLine} key={line}>
                              {line}
                            </span>
                          ))
                        : undefined
                    }
                    name={option.key}
                    checked={isOn}
                    disabled={disabled}
                    onChange={(event) =>
                      onToggle(option.key, event.target.checked)
                    }
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <p className={styles.helper}>{footerText}</p>
    </section>
  );
}

export default NotificationsCard;
