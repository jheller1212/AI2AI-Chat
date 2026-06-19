import { useState } from 'react';
import { maskKey } from '../lib/apiKeyVault';

interface MaskedKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * API-key input that shows a masked preview of a saved key (first ~10 chars)
 * when not focused, so users can tell which key is stored, and reveals an
 * editable password field on focus.
 */
export function MaskedKeyInput({ value, onChange, placeholder, className, disabled }: MaskedKeyInputProps) {
  const [editing, setEditing] = useState(false);
  const showMask = !editing && value.length > 0;

  return (
    <input
      type={showMask ? 'text' : 'password'}
      value={showMask ? maskKey(value) : value}
      readOnly={showMask}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      spellCheck={false}
      autoComplete="off"
      className={className}
    />
  );
}
