'use client';

import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  const cls = [
    styles.card,
    glow ? styles.cardGlow : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={cls}>{children}</div>;
}
