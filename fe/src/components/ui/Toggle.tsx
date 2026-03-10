'use client';

import React from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        type="button"
        className={`${styles.toggle} ${checked ? styles.toggleOn : styles.toggleOff}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={label ?? 'toggle'}
      />
    </div>
  );
}
