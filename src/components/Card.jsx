import styles from "./Card.module.css";

function Card({ as: Tag = "section", className = "", children, ...rest }) {
  const classes = [styles.card, className].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export default Card;
