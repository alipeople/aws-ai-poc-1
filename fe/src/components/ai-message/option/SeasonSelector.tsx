'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
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

const ALL_SEASON_IDS: string[] = [...RECOMMENDED_SEASONS, ...OTHER_SEASONS].map((s) => s.id);

export interface SeasonSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  const isCustom = value !== '' && !ALL_SEASON_IDS.includes(value);
  const [showCustomInput, setShowCustomInput] = useState(isCustom);

  const handleCustomClick = () => {
    setShowCustomInput(true);
    onChange('');
  };

  const handlePresetClick = (id: string) => {
    setShowCustomInput(false);
    onChange(id);
  };

  const isNone = value === '' && !showCustomInput;

  const handleNoneClick = () => {
    setShowCustomInput(false);
    onChange('');
  };

  return (
    <Card>
      <div className={styles.header}>
        ⑤ 시즌 &amp; 이벤트 (선택)
      </div>
      <div className={styles.description}>
        현재 시즌에 맞는 이벤트 키워드를 자연스럽게 반영합니다
      </div>

      <div className={styles.seasonDetect}>🟢 3월 추천</div>
      <div className={styles.seasonGroup}>
        <div className={styles.chipGrid}>
          <Chip
            icon="🚫"
            label="사용 안함"
            selected={isNone}
            onClick={handleNoneClick}
          />
          {RECOMMENDED_SEASONS.map((s) => (
            <Chip
              key={s.id}
              icon={s.icon}
              label={s.label}
              selected={!showCustomInput && value === s.id}
              onClick={() => handlePresetClick(s.id)}
            />
          ))}
        </div>
      </div>

      <div className={styles.seasonGroupLabel}>그 외</div>
      <div className={styles.chipGrid}>
        {OTHER_SEASONS.map((s) => (
          <Chip
            key={s.id}
            icon={s.icon}
            label={s.label}
            selected={!showCustomInput && value === s.id}
            onClick={() => handlePresetClick(s.id)}
          />
        ))}
        <Chip
          icon="✏️"
          label="직접 입력"
          selected={showCustomInput}
          onClick={handleCustomClick}
        />
      </div>
      {showCustomInput && (
        <input
          className={styles.customInput}
          placeholder="예: 창립기념일, 블랙프라이데이, 가정의달..."
          value={isCustom ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </Card>
  );
}
