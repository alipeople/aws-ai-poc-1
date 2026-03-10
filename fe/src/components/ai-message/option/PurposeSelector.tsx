'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import styles from './StepHeader.module.css';

const PURPOSES = [
  { id: 'promotion', label: '프로모션/할인', icon: '🏷️' },
  { id: 'notice', label: '안내/공지', icon: '📢' },
  { id: 'event', label: '이벤트 초대', icon: '🎉' },
  { id: 'reminder', label: '리마인더', icon: '🔔' },
  { id: 'review', label: '리뷰 요청', icon: '⭐' },
  { id: 'greeting', label: '인사/감사', icon: '👋' },
] as const;

export interface PurposeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PurposeSelector({ value, onChange }: PurposeSelectorProps) {
  return (
    <Card>
      <div className={styles.header}>② 메시지 목적</div>
      <div className={styles.description}>
        목적에 따라 AI가 톤과 구조를 최적화합니다
      </div>
      <div className={styles.chipGrid}>
        {PURPOSES.map((p) => (
          <Chip
            key={p.id}
            icon={p.icon}
            label={p.label}
            selected={value === p.id}
            onClick={() => onChange(p.id)}
          />
        ))}
      </div>
    </Card>
  );
}
