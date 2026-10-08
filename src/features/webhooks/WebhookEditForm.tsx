import type { FormEvent } from 'react'
import { TextField } from '../forms/Field'
import type { WebhookEditFormState } from './useWebhookEdit'

type WebhookEditFormProps = {
  form: WebhookEditFormState
}

export function WebhookEditForm({ form }: WebhookEditFormProps) {
  function onSubmit(event: FormEvent) {
    event.preventDefault()
    form.submit({ name: form.name, url: form.url })
  }

  return (
    <form className="card form-card" onSubmit={onSubmit}>
      <TextField
        label="Назва"
        name="name"
        value={form.name}
        error={form.fieldErrors?.name}
        onChange={form.setName}
      />
      <TextField
        label="URL"
        name="url"
        value={form.url}
        error={form.fieldErrors?.url}
        onChange={form.setUrl}
      />
      {form.formError ? (
        <p className="field-error" role="alert">
          {form.formError}
        </p>
      ) : null}
      {form.isSaved ? <p className="success">Збережено.</p> : null}
      <button type="submit" disabled={form.isSaving || !form.canSave}>
        {form.isSaving ? 'Збереження…' : 'Зберегти'}
      </button>
    </form>
  )
}
