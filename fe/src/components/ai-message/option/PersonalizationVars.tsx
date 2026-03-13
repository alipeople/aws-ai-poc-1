'use client';

import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { PersonalizationVar } from '@/types/api';
import styles from './PersonalizationVars.module.css';

const MOCK_VARS: PersonalizationVar[] = [
  { template: '{{고객명}}', description: '수신자 이름' },
  { template: '{{최근구매상품}}', description: '구매 상품명' },
  { template: '{{적립포인트}}', description: '보유 포인트' },
];

export interface PersonalizationVarsProps {
  vars?: PersonalizationVar[];
  onInsert?: (template: string) => void;
}

export function PersonalizationVars({
  vars,
  onInsert,
}: PersonalizationVarsProps) {
  const items = vars && vars.length > 0 ? vars : MOCK_VARS;
  const [inserted, setInserted] = useState<Set<string>>(new Set());

  const handleInsert = useCallback(
    (template: string) => {
      if (inserted.has(template)) return;
      setInserted((prev) => new Set(prev).add(template));
      onInsert?.(template);
    },
    [inserted, onInsert],
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        👤 개인화 변수 추천 <Badge variant="ai">AI</Badge>
      </div>
      <div className={styles.subtitle}>
        삽입 가능한 변수를 AI가 추천합니다
      </div>

      {items.map((v) => {
        const isDone = inserted.has(v.template);

        return (
          <div key={v.template} className={styles.varRow}>
            <code className={styles.varTemplate}>{v.template}</code>
            <span className={styles.varDesc}>{v.description}</span>
            {isDone ? (
              <span className={styles.insertBtnDone}>✓ 삽입됨</span>
            ) : (
              <button
                type="button"
                className={styles.insertBtn}
                onClick={() => handleInsert(v.template)}
              >
                삽입
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
