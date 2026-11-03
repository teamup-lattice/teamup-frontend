import Select from "../../components/Select";
import { filterFields } from "../../data/discoverData";

function FilterFields({ idPrefix, values, onChange }) {
  return filterFields.map((field) => (
    <Select
      key={field.key}
      id={`${idPrefix}-${field.key}`}
      label={field.label}
      placeholder={field.placeholder}
      options={field.options}
      value={values[field.key]}
      onChange={(event) => onChange(field.key, event.target.value)}
    />
  ));
}

export default FilterFields;