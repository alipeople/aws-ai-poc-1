'use client';

import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import styles from './FatigueAlert.module.css';

export interface FatigueAlertProps {
  count?: number;
  rate?: number;
  recommendation?: string;
  onSeparate?: () => void;
}

export function FatigueAlert({
  count = 1247,
  rate = 8.1,
  recommendation = '3일 후 발송을 권장합니다',
  onSeparate,
}: FatigueAlertProps) {
  const [separated, setSeparated] = useState(false);

  const handleSeparate = useCallback(() => {
    setSeparated(true);
    onSeparate?.();
  }, [onSeparate]);

  const formattedCount = count.toLocaleString();

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.icon}>😴</div>
        <div className={styles.body}>
          <div className={styles.title}>
            ⚠️ 발송 피로도 경고 <Badge variant="warn">AI</Badge>
          </div>
          <div className={styles.description}>
            수신자 중{' '}
            <strong className={styles.highlight}>
              {formattedCount}명
            </strong>
            은 최근 7일 내 2회 이상 수신 ({rate}%).{' '}
            <strong className={styles.recommendation}>
              {recommendation}
            </strong>{' '}
            (거부 위험 -62%)
          </div>
        </div>
        {separated ? (
          <span className={styles.separateBtnDone}>✓ 분리 완료</span>
        ) : (
          <button
            type="button"
            className={styles.separateBtn}
            onClick={handleSeparate}
          >
            발송 분리하기
          </button>
        )}
      </div>
    </div>
  );
}
