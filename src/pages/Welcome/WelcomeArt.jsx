import styles from "./WelcomeArt.module.css";

// Decorative illustration: three steps rising from Learn to Build to Prove.
// Colours come from CSS Module classes, which use variables.css tokens only.
function WelcomeArt() {
  return (
    <svg
      className={styles.art}
      viewBox="0 0 380 300"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className={styles.ground} cx="190" cy="276" rx="175" ry="12" />

      <circle className={`${styles.sparkle} ${styles.sparkleA}`} cx="40" cy="70" r="2.5" />
      <circle className={`${styles.sparkle} ${styles.sparkleB}`} cx="130" cy="40" r="3" />
      <circle className={`${styles.sparkle} ${styles.sparkleC}`} cx="236" cy="28" r="2" />
      <circle className={`${styles.sparkle} ${styles.sparkleA}`} cx="360" cy="150" r="2.5" />

      <path
        className={styles.trail}
        d="M72 146 C110 122 150 112 192 100 S 262 78 296 58"
      />

      {/* Step 1: Learn */}
      <g>
        <rect className={styles.b1Front} x="16" y="196" width="88" height="74" />
        <polygon className={styles.b1Top} points="16,196 40,182 128,182 104,196" />
        <polygon className={styles.b1Side} points="104,196 128,182 128,256 104,270" />
        <text className={styles.labelDark} x="60" y="238">Learn</text>
        <g className={`${styles.person} ${styles.floatA}`}>
          <circle cx="72" cy="163" r="9" />
          <ellipse cx="72" cy="181" rx="11" ry="13" />
        </g>
      </g>

      {/* Step 2: Build */}
      <g>
        <rect className={styles.b2Front} x="136" y="150" width="88" height="120" />
        <polygon className={styles.b2Top} points="136,150 160,136 248,136 224,150" />
        <polygon className={styles.b2Side} points="224,150 248,136 248,256 224,270" />
        <text className={styles.labelLight} x="180" y="215">Build</text>
        <g className={`${styles.person} ${styles.floatB}`}>
          <circle cx="192" cy="117" r="9" />
          <ellipse cx="192" cy="135" rx="11" ry="13" />
        </g>
      </g>

      {/* Step 3: Prove */}
      <g>
        <rect className={styles.b3Front} x="256" y="100" width="88" height="170" />
        <polygon className={styles.b3Top} points="256,100 280,86 368,86 344,100" />
        <polygon className={styles.b3Side} points="344,100 368,86 368,256 344,270" />
        <text className={styles.labelLight} x="300" y="190">Prove</text>
        <g className={`${styles.person} ${styles.floatC}`}>
          <circle cx="312" cy="67" r="9" />
          <ellipse cx="312" cy="85" rx="11" ry="13" />
          <circle className={styles.badge} cx="336" cy="46" r="11" />
          <path className={styles.check} d="M331 46 l4 4 l8 -8" />
        </g>
      </g>
    </svg>
  );
}

export default WelcomeArt;
