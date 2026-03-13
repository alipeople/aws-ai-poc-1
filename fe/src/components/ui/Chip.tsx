'use client';

import React from 'react';
import styles from './Chip.module.css';

export interface ChipProps {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}

export function Chip({ label, icon, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.chipOn : ''}`}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
