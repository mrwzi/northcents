export function ModeSelector<TMode extends string>({
  label,
  mode,
  options,
  onChange,
}: Readonly<{
  label: string;
  mode: TMode;
  options: readonly Readonly<{ value: TMode; label: string }>[];
  onChange: (mode: TMode) => void;
}>) {
  return (
    <fieldset className="mode-selector">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            aria-pressed={mode === option.value}
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
