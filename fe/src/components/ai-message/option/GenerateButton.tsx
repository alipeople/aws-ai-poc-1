'use client';

import React from 'react';
import styles from './GenerateButton.module.css';

export interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function GenerateButton({ onClick, isLoading, disabled }: GenerateButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      disabled={isLoading || disabled}
    >
      {isLoading ? '생성 중...' : '✨ A/B 메시지 3종 생성하기'}
    </button>
  );
}
