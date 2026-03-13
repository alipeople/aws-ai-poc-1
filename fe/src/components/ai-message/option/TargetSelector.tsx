'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import styles from './StepHeader.module.css';

const TARGETS = [
  { id: 'all', label: '전체 발송', icon: '👥' },
  { id: 'addressbook', label: '주소록 선택', icon: '📒' },
  { id: 'ai-recommend', label: 'AI 추천 타겟', icon: '🎯' },
] as const;

const SEND_TIMES = [
  { id: 'now', label: '즉시 발송', icon: '⚡' },
  { id: 'scheduled', label: '예약 발송', icon: '📅' },
  { id: 'ai-time', label: 'AI 추천 시간', icon: '🤖' },
] as const;

export interface TargetSelectorProps {
  target: string;
  onTargetChange: (value: string) => void;
  sendTime: string;
  onSendTimeChange: (value: string) => void;
}

export function TargetSelector({
  target,
  onTargetChange,
  sendTime,
  onSendTimeChange,
}: TargetSelectorProps) {
  return (
    <Card>
      <div className={styles.header}>⑥ 발송 대상 &amp; 시간</div>

      {/* Target selection */}
      <div className={styles.targetSection}>
        <div className={styles.sectionLabel}>발송 대상</div>
        <div className={styles.chipGrid}>
          {TARGETS.map((t) => (
            <Chip
              key={t.id}
              icon={t.icon}
              label={t.label}
              selected={target === t.id}
              onClick={() => onTargetChange(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Send time selection */}
      <div className={styles.sectionLabel}>발송 시간</div>
      <div className={styles.chipGrid}>
        {SEND_TIMES.map((t) => (
          <Chip
            key={t.id}
            icon={t.icon}
            label={t.label}
            selected={sendTime === t.id}
            onClick={() => onSendTimeChange(t.id)}
          />
        ))}
      </div>
    </Card>
  );
}
