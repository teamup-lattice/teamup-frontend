import { useEffect, useRef } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import FilterFields from "./FilterFields";
import styles from "./Filters.module.css";

const FOCUSABLE =
  'button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// Mobile filter sheet: focus starts on the heading, Tab stays inside the sheet,
// and Escape or Close discards changes (the page restores focus to "Filters").
function FilterSheet({ values, onChange, onApply, onReset, onClose }) {
  const sheetRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const items = Array.from(sheetRef.current.querySelectorAll(FOCUSABLE));
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === headingRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply();
  };

  return (
    <div className={styles.overlay}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        ref={sheetRef}
        onKeyDown={handleKeyDown}
      >
        <h2
          className={styles.sheetTitle}
          id="filter-sheet-title"
          tabIndex={-1}
          ref={headingRef}
        >
          Filter projects
        </h2>
        <button
          type="button"
          className={`${styles.linkButton} ${styles.closeLink}`}
          onClick={onClose}
        >
          Close
        </button>
        <p className={styles.sheetText}>
          Apply to update results. Close to discard filter changes.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <FilterFields idPrefix="sheet" values={values} onChange={onChange} />

          {values.skill && (
            <div className={styles.chips}>
              <span className={styles.chip}>
                {values.skill}
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Remove ${values.skill} filter`}
                  onClick={() => onChange("skill", "")}
                >
                  Remove ×
                </button>
              </span>
            </div>
          )}

          <Alert variant="info" title="Eligibility stays on">
            Required skills, weekly hours and duration remain enforced after
            Reset filters.
          </Alert>

          <div className={styles.actions}>
            <Button type="submit" fullWidth>
              Apply changes
            </Button>
            <Button variant="secondary" fullWidth onClick={onReset}>
              Reset filters
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FilterSheet;