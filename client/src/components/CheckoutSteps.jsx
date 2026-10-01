import Icon from './Icon';

const STEPS = ['Cart', 'Checkout', 'Confirmation'];

/** Cart → Checkout → Confirmation progress indicator */
export default function CheckoutSteps({ current }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={active ? 'step' : undefined}>
              {i > 0 && <span className={`h-px w-6 sm:w-12 ${done || active ? 'bg-slate-900' : 'bg-stone-300'}`} aria-hidden="true" />}
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition ${
                    done ? 'bg-slate-900 text-white' : active ? 'bg-slate-900 text-white ring-4 ring-slate-900/10' : 'bg-stone-200 text-slate-500'
                  }`}
                >
                  {done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className={`text-sm font-medium ${active ? 'text-slate-900' : 'text-slate-500'} ${active ? '' : 'max-sm:hidden'}`}>{label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
