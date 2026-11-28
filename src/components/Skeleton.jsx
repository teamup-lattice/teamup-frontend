import styles from "./Skeleton.module.css";

const VARIANT_CLASS = {
  bar: styles.bar,
  row: styles.row,
  avatar: styles.avatar,
  title: styles.title,
  progress: styles.progress,
  button: styles.button,
};

function Skeleton({ variant, width, height, className, count = 1 }) {
  const sizeStyle = {
    ...(width != null ? { width } : null),
    ...(height != null ? { height } : null),
  };

  if (!variant) {
    const cards = Array.from({ length: Math.max(1, count) }, (_, index) => (
      <div
        className={[styles.card, className].filter(Boolean).join(" ")}
        aria-hidden="true"
        key={index}
      >
        <div className={styles.titleBar} />
        <div className={styles.bodyBar} />
      </div>
    ));
    return count > 1 ? <>{cards}</> : cards[0];
  }

  const variantClass = VARIANT_CLASS[variant] ?? styles.bar;
  const barClass = [styles.base, variantClass, className]
    .filter(Boolean)
    .join(" ");

  const bars = Array.from({ length: Math.max(1, count) }, (_, index) => (
    <span
      className={barClass}
      style={sizeStyle}
      aria-hidden="true"
      key={index}
    />
  ));

  return count > 1 ? <>{bars}</> : bars[0];
}

export default Skeleton;
