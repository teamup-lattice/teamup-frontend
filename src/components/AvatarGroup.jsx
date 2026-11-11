import styles from "./AvatarGroup.module.css";

function AvatarGroup({ items, label, hidden = false }) {
  return (
    <div
      className={styles.avatars}
      role={hidden ? undefined : "group"}
      aria-label={hidden ? undefined : label}
      aria-hidden={hidden || undefined}
    >
      {items.map((item, index) => {
        const avatar =
          typeof item === "string"
            ? { initial: item, label: undefined }
            : item;

        return (
          <span
            className={styles.avatar}
            key={`${avatar.label ?? avatar.initial}-${index}`}
            role={avatar.label ? "img" : undefined}
            aria-label={avatar.label}
          >
            {avatar.initial}
          </span>
        );
      })}
    </div>
  );
}

export default AvatarGroup;
