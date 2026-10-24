import { useEffect } from "react";
import LandingHeader from "./LandingHeader";
import Hero from "./Hero";
import ValueStrip from "./ValueStrip";
import HowItWorks from "./HowItWorks";
import Discover from "./Discover";
import Commitment from "./Commitment";
import Workspace from "./Workspace";
import Support from "./Support";
import FinalCta from "./FinalCta";
import LandingFooter from "./LandingFooter";
import styles from "./Landing.module.css";

function Landing() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "TeamUp: Learn a skill. Build with a team.";

    const root = document.documentElement;
    const originalScrollBehavior = root.style.scrollBehavior;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    root.style.scrollBehavior = prefersReducedMotion.matches ? "auto" : "smooth";

    const updateScrollBehavior = (event) => {
      root.style.scrollBehavior = event.matches ? "auto" : "smooth";
    };
    prefersReducedMotion.addEventListener("change", updateScrollBehavior);

    return () => {
      prefersReducedMotion.removeEventListener("change", updateScrollBehavior);
      root.style.scrollBehavior = originalScrollBehavior;
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className={styles.landingPage}>
      <LandingHeader />
      <main>
        <Hero />
        <ValueStrip />
        <HowItWorks />
        <Discover />
        <Commitment />
        <Workspace />
        <Support />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}

export default Landing;
