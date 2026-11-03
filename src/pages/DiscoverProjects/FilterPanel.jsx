import Button from "../../components/Button";
import FilterFields from "./FilterFields";
import styles from "./Filters.module.css";

function FilterPanel({ values, onChange, onApply, onReset }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onApply();
  };

  return (
    <aside className={styles.panel} aria-labelledby="filter-panel-title">
      <h2 className={styles.panelTitle} id="filter-panel-title">
        Filter Open projects
      </h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <FilterFields idPrefix="panel" values={values} onChange={onChange} />
        <Button type="submit" fullWidth>
          Apply filters
        </Button>
        <button type="button" className={styles.linkButton} onClick={onReset}>
          Reset filters
        </button>
        <p className={styles.helper}>
          Reset clears optional filters only; eligibility still applies.
        </p>
      </form>
    </aside>
  );
}

export default FilterPanel;