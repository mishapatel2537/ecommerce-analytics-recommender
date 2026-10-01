import { forwardRef, useId, useState } from 'react';
import Icon from '../Icon';

/** Label + control + hint / error, wired up with ids for screen readers */
function FieldShell({ id, label, hint, error, optional, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-slate-700">
          {label}
          {optional && <span className="text-xs font-normal text-slate-400">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-fade-in">
          <Icon name="alert" className="h-3.5 w-3.5" /> {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const described = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

/**
 * <TextField label="Email" icon="mail" type="email" error={errors.email} ... />
 * `end` renders inside the right edge of the input (e.g. a show-password toggle).
 */
export const TextField = forwardRef(function TextField({ label, hint, error, icon, end, optional, className, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        {icon && <Icon name={icon} className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={described(id, error, hint)}
          className={`field h-11 ${icon ? 'pl-10.5' : ''} ${end ? 'pr-11' : ''}`}
          {...props}
        />
        {end && <div className="absolute inset-y-0 right-1 flex items-center">{end}</div>}
      </div>
    </FieldShell>
  );
});

export const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      ref={ref}
      icon="lock"
      {...props}
      type={visible ? 'text' : 'password'}
      end={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-stone-100 hover:text-slate-700"
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} className="h-4.5 w-4.5" />
        </button>
      }
    />
  );
});

export const TextArea = forwardRef(function TextArea({ label, hint, error, optional, className, maxLength, value, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={described(id, error, hint)}
          className="field min-h-28 resize-y pb-7"
          {...props}
        />
        {maxLength && (
          <span className="pointer-events-none absolute right-3 bottom-2.5 text-xs text-slate-400 tabular-nums">
            {String(value ?? '').length}/{maxLength}
          </span>
        )}
      </div>
    </FieldShell>
  );
});

export const Select = forwardRef(function Select({ label, className = '', selectClassName = '', id: idProp, children, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <FieldShell id={id} label={label} className={className}>
      <select ref={ref} id={id} className={`field field-select h-10 py-0 ${selectClassName}`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
});
