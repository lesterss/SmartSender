import type { ReactNode } from 'react'

type FieldProps = {
  label: string
  error?: string[]
  children: ReactNode
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error?.length ? (
        <span className="field-error" role="alert">
          {error.join(' ')}
        </span>
      ) : null}
    </label>
  )
}

type TextFieldProps = {
  label: string
  name: string
  type?: string
  value: string
  autoComplete?: string
  error?: string[]
  onChange: (value: string) => void
}

export function TextField({
  label,
  name,
  type = 'text',
  value,
  autoComplete,
  error,
  onChange,
}: TextFieldProps) {
  return (
    <Field label={label} error={error}>
      <input
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error?.length)}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}
