import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Select from "../../components/Select";
import styles from "./Filters.module.css";

function FilterFields({
  idPrefix,
  values,
  onChange,
  fields,
  skillStatus = "ready",
  onRetrySkills,
}) {
  return fields.map((field) => {
    if (field.dynamic === "skills" && skillStatus === "loading") {
      return (
        <Select
          key={field.key}
          id={`${idPrefix}-${field.key}`}
          label={field.label}
          placeholder="Loading skills…"
          options={[]}
          value=""
          disabled
          helperText="Loading skills…"
        />
      );
    }

    if (field.dynamic === "skills" && skillStatus === "error") {
      return (
        <div className={styles.fieldStatus} key={field.key}>
          <span className={styles.fieldStatusLabel}>{field.label}</span>
          <Alert variant="error" title="Skills could not load">
            Skill options are unavailable.
          </Alert>
          {onRetrySkills && (
            <Button variant="secondary" fullWidth onClick={onRetrySkills}>
              Retry skills
            </Button>
          )}
        </div>
      );
    }

    return (
      <Select
        key={field.key}
        id={`${idPrefix}-${field.key}`}
        label={field.label}
        placeholder={field.placeholder}
        options={field.options}
        value={values[field.key]}
        disabled={field.disabled}
        helperText={field.helperText}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
    );
  });
}

export default FilterFields;
