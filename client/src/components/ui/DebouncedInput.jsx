import { forwardRef, useEffect, useState } from 'react';

/** Text input that reports its value after the user stops typing */
const DebouncedInput = forwardRef(function DebouncedInput({ value, onChange, delay = 350, ...props }, ref) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return undefined;
    const id = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(id);
  }, [text, value, delay, onChange]);

  return <input ref={ref} {...props} value={text} onChange={(e) => setText(e.target.value)} />;
});

export default DebouncedInput;
