'use client';

import React from 'react';
import styles from './QuickActions.module.css';

const ACTIONS = [
  '📦 제품링크 문구 만들기',
  '⭐ 과거 성공문구 참고',
  '🎯 프로모션 알림 작성',
  '🖼️ 이미지 포함 메시지',
] as const;

export interface QuickActionsProps {
  onAction: (text: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className={styles.row}>
      {ACTIONS.map((label) => (
        <button
          key={label}
          type="button"
          className={styles.btn}
          onClick={() => onAction(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
