import { Link } from "react-router-dom";
import { SlidersIcon } from "../../components/Icons";
import { GET_STARTED_PATH } from "./landingConfig";
import styles from "./Discover.module.css";
import useReveal from "./useReveal";

const projects = [
  {
    title: "Campus Marketplace",
    description:
      "Help students exchange campus items beyond scattered group chats.",
  },
  {
    title: "Campus resource directory",
    description:
      "Make campus services and useful resources easier for students to find.",
  },
];

function Discover() {
  const eyebrowReveal = useReveal();
  const headingReveal = useReveal();
  const descriptionReveal = useReveal();
  const projectsReveal = useReveal({ staggerChildren: true });

  return (
    <section
      id="discover-projects"
      className={styles.section}
      aria-labelledby="discover-title"
    >
      <div className={styles.container}>
        <p className={styles.eyebrow} ref={eyebrowReveal}>
          Find your team
        </p>
        <div className={styles.intro}>
          <h2
            id="discover-title"
            className={styles.heading}
            ref={headingReveal}
          >
            A project that fits your skills.
            <br />
            A team you can build with.
          </h2>
          <p className={styles.description} ref={descriptionReveal}>
            Explore open projects by required skills, weekly hours and duration.
            Have an idea already? Find collaborators to help bring it to life.
          </p>
        </div>

        <p className={styles.filterSummary}>
          <span>Discover projects</span>
          <span>or find collaborators for your own idea</span>
        </p>

        <div className={styles.projectGrid} ref={projectsReveal}>
          {projects.map((project) => (
            <article className={styles.projectCard} key={project.title}>
              <span className={styles.badge}>Open</span>
              <h3>{project.title}</h3>
              <p className={styles.projectDescription}>
                {project.description}
              </p>
              <p className={styles.projectDetail}>
                UI/UX Designer · UI design + Prototyping
              </p>
              <p className={styles.projectDetail}>
                6 h / week · 6 weeks · Web application
              </p>
              <Link className={styles.projectLink} to={GET_STARTED_PATH}>
                View project
              </Link>
              <p className={styles.projectNote}>
                Review the role and commitment before requesting to join.
              </p>
            </article>
          ))}
        </div>

        <div className={styles.footer}>
          <p>
            <SlidersIcon />
            <span>
              Your skills, hours and preferred duration guide what you can
              join—not a ranking.
            </span>
          </p>
          <span className={styles.caption}>Illustrative project listings</span>
        </div>
      </div>
    </section>
  );
}

export default Discover;
