import {
  CompassIcon,
  LayersIcon,
  UserIcon,
} from "../../components/Icons";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    title: "Tell us what you bring",
    description:
      "Share your track, skills, goals, weekly hours and preferred duration. Add your self-assessed level—not a score.",
    Icon: UserIcon,
  },
  {
    number: "02",
    title: "Choose a real project",
    description:
      "Discover projects that fit your skills and time, or find collaborators for a project of your own.",
    Icon: CompassIcon,
  },
  {
    number: "03",
    title: "Build your evidence",
    description:
      "Agree on the role, build together, and record the contributions and deliverables you share along the way.",
    Icon: LayersIcon,
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className={styles.section}
      aria-labelledby="how-it-works-title"
    >
      <div className={styles.container}>
        <p className={styles.eyebrow}>From skills to shared work</p>
        <h2 id="how-it-works-title" className={styles.heading}>
          Your next project starts with you.
        </h2>
        <div className={styles.steps}>
          {steps.map(({ number, title, description, Icon }) => (
            <article className={styles.step} key={number}>
              <div className={styles.stepHeader}>
                <span className={styles.icon}>
                  <Icon />
                </span>
                <span className={styles.number}>{number}</span>
              </div>
              <h3 className={styles.stepTitle}>{title}</h3>
              <p className={styles.stepDescription}>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
