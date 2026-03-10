'use client';

import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'ai' | 'ok' | 'warn' | 'acc';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
