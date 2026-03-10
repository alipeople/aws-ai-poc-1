'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import styles from './StepHeader.module.css';

const RECOMMENDED_SEASONS = [
  { id: 'spring', label: '봄맞이', icon: '🌸' },
  { id: 'whiteday', label: '화이트데이', icon: '🤍' },
  { id: 'easter', label: '부활절', icon: '🐣' },
] as const;

const OTHER_SEASONS = [
  { id: 'parents', label: '어버이날', icon: '💐' },
  { id: 'summer', label: '여름', icon: '☀️' },
  { id: 'chuseok', label: '추석', icon: '🌕' },
  { id: 'christmas', label: '크리스마스', icon: '🎄' },
  { id: 'yearend', label: '연말', icon: '🎊' },
  { id: 'newyear', label: '설날', icon: '🎍' },
] as const;

export interface SeasonSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  return (
    <Card>
      <div className={styles.header}>
        ⑤ 시즌 &amp; 이벤트{' '}
        <Badge variant="ok">자동감지</Badge>
      </div>
      <div className={styles.description}>
        현재 시즌에 맞는 이벤트 키워드를 자연스럽게 반영합니다
      </div>

      {/* Auto-detected season */}
      <div className={styles.seasonDetect}>🟢 3월 추천</div>
      <div className={styles.seasonGroup}>
        <div className={styles.chipGrid}>
          {RECOMMENDED_SEASONS.map((s) => (
            <Chip
              key={s.id}
              icon={s.icon}
              label={s.label}
              selected={value === s.id}
              onClick={() => onChange(s.id)}
            />
          ))}
        </div>
      </div>

      {/* Other seasons */}
      <div className={styles.seasonGroupLabel}>그 외</div>
      <div className={styles.chipGrid}>
        {OTHER_SEASONS.map((s) => (
          <Chip
            key={s.id}
            icon={s.icon}
            label={s.label}
            selected={value === s.id}
            onClick={() => onChange(s.id)}
          />
        ))}
      </div>
    </Card>
  );
}
