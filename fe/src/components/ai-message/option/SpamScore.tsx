'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { SpamCheck } from '@/types/api';
import styles from './SpamScore.module.css';

const MOCK_CHECKS: SpamCheck[] = [
  { label: '스팸 키워드', passed: true, detail: '없음' },
  { label: 'URL 안전성', passed: true, detail: '안전' },
  { label: '특수문자 비율', passed: true, detail: '정상 (3.2%)' },
  { label: '대문자 비율', passed: true, detail: '정상' },
];

export interface SpamScoreProps {
  score?: number;
  checks?: SpamCheck[];
}

function getScoreColor(score: number) {
  if (score < 30) return 'green' as const;
  if (score <= 60) return 'yellow' as const;
  return 'red' as const;
}

function getScoreText(score: number): string {
  if (score < 30) return '안전';
  if (score <= 60) return '주의';
  return '위험';
}

export function SpamScore({ score = 12, checks }: SpamScoreProps) {
  const items = checks && checks.length > 0 ? checks : MOCK_CHECKS;
  const color = getScoreColor(score);

  const circleClass = [
    styles.scoreCircle,
    color === 'green'
      ? styles.scoreCircleGreen
      : color === 'yellow'
        ? styles.scoreCircleYellow
        : styles.scoreCircleRed,
  ].join(' ');

  const labelClass = [
    styles.scoreLabel,
    color === 'green'
      ? styles.scoreLabelGreen
      : color === 'yellow'
        ? styles.scoreLabelYellow
        : styles.scoreLabelRed,
  ].join(' ');

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div className={styles.title}>
          🛡️ 스팸 점수 분석 <Badge variant="ai">AI</Badge>
        </div>
        <div className={styles.scoreInfo}>
          <div className={circleClass}>{score}</div>
          <span className={labelClass}>{getScoreText(score)}</span>
        </div>
      </div>

      {items.map((check) => (
        <div key={check.label} className={styles.checkRow}>
          <span className={styles.checkIcon}>
            {check.passed ? '✅' : '⚠️'}
          </span>
          <div className={styles.checkContent}>
            <div className={styles.checkLabel}>{check.label}</div>
            {check.detail && (
              <div
                className={
                  check.passed ? styles.checkDetail : styles.checkDetailWarn
                }
              >
                {check.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
