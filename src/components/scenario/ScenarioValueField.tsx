export function ScenarioValueField({
  id,
  label,
  hint,
  value,
  unit,
  error,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  hint: string;
  value: string;
  unit: "$" | "%";
  error: string | null;
  onChange: (value: string) => void;
}>) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="scenario-value-field">
      <label htmlFor={id}>{label}</label>
      <div className="scenario-input-wrap">
        {unit === "$" ? <span aria-hidden="true">$</span> : null}
        <input
          aria-describedby={`${hintId}${error === null ? "" : ` ${errorId}`}`}
          aria-invalid={error !== null}
          autoComplete="off"
          id={id}
          inputMode="decimal"
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
        <span aria-hidden="true">{unit === "$" ? "CAD / month" : "%"}</span>
      </div>
      <p className="field-hint" id={hintId}>
        {hint}
      </p>
      {error === null ? null : (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
