import { useState } from "react";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import {
  notificationGroups,
  notificationOptions,
  onOff,
} from "./notificationOptions";
import styles from "./Settings.module.css";

const DEFAULT_OPTION_KEYS = [
  "invitations",
  "joinRequests",
  "deadlineReminders",
  "overduePrompts",
];

function NotificationsCard({
  values,
  savedValues,
  hasSavedPreferences,
  saveStatus,
  disabled,
  onToggle,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  let footerText = "Changes apply after you save.";
  if (saveStatus === "saving" || saveStatus === "error") {
    footerText =
      "Your previous saved preferences stay active until this save succeeds.";
  } else if (!hasSavedPreferences) {
    footerText = "Default choices · Not saved yet.";
  }

  const defaultOptions = DEFAULT_OPTION_KEYS.map((key) =>
    notificationOptions.find((option) => option.key === key),
  ).filter(Boolean);

  const collapsibleGroups = notificationGroups
    .filter((group) => group.title !== "Other")
    .map((group) => ({
      ...group,
      options: group.options.filter(
        (option) =>
          Boolean(option.type) && !DEFAULT_OPTION_KEYS.includes(option.key),
      ),
    }))
    .filter((group) => group.options.length > 0);

  const collapsibleOptions = collapsibleGroups.flatMap(
    (group) => group.options,
  );

  const unsavedCount = collapsibleOptions.filter((option) => {
    const isOn = values[option.key] ?? true;
    const savedVal = savedValues[option.key] ?? true;
    return isOn !== savedVal;
  }).length;

  const unsavedText = `${unsavedCount} unsaved ${
    unsavedCount === 1 ? "change" : "changes"
  } in more notifications.`;

  const renderOptionItem = (option) => {
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
          onChange={(event) => onToggle(option.key, event.target.checked)}
        />
      </li>
    );
  };

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

      <ul className={styles.notificationList}>
        {defaultOptions.map(renderOptionItem)}
      </ul>

      <div className={styles.accountAction}>
        <Button
          variant="secondary"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="more-notifications-region"
        >
          {isExpanded
            ? "Show fewer notification types"
            : "Show more notification types"}
        </Button>
        {!isExpanded && unsavedCount > 0 && (
          <p className={styles.helper}>{unsavedText}</p>
        )}
      </div>

      <div
        id="more-notifications-region"
        hidden={!isExpanded}
        style={isExpanded ? undefined : { display: "none" }}
        className={styles.column}
      >
        {collapsibleGroups.map((group) => (
          <div key={group.title} className={styles.cardHeader}>
            <h3>{group.title}</h3>
            <ul className={styles.notificationList}>
              {group.options.map(renderOptionItem)}
            </ul>
          </div>
        ))}
      </div>

      <p className={styles.helper}>{footerText}</p>
    </section>
  );
}

export default NotificationsCard;
