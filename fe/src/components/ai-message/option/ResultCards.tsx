'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { MessageVariant } from '@/types/api';
import styles from './ResultCards.module.css';

const MOCK_VARIANTS: MessageVariant[] = [
  {
    label: 'A',
    title: '간결형',
    text: '[봄맞이 특가] 최대 30% 할인! 지금 바로 확인하세요 👉 bit.ly/spring',
    predictedOpenRate: 42,
    predictedClickRate: 18,
    charCount: 45,
  },
  {
    label: 'B',
    title: '감성형',
    text: '🌸 봄이 왔어요! 새 시즌 컬렉션과 함께 특별한 봄을 맞이하세요. 30% 특가 진행 중',
    predictedOpenRate: 38,
    predictedClickRate: 15,
    charCount: 52,
  },
  {
    label: 'C',
    title: '긴급형',
    text: '⏰ 오늘만! 봄맞이 30% 할인 마감 임박. 지금 구매하지 않으면 후회합니다',
    predictedOpenRate: 45,
    predictedClickRate: 22,
    charCount: 48,
  },
];

export interface ResultCardsProps {
  variants: MessageVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onReset?: () => void;
  onRegenerate?: () => void;
  onSend?: () => void;
}

export function ResultCards({
  variants,
  selectedIndex,
  onSelect,
  onReset,
  onRegenerate,
  onSend,
}: ResultCardsProps) {
  const items = variants.length > 0 ? variants : MOCK_VARIANTS;

  return (
    <>
      <div className={styles.grid}>
        {items.map((v, i) => {
          const isSelected = i === selectedIndex;
          const cls = [
            styles.variantCard,
            isSelected ? styles.variantCardSelected : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={v.label} className={cls} onClick={() => onSelect(i)}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>
                  {v.label}안 — {v.title}
                </span>
                {i === 0 && <Badge variant="ai">✨ AI 추천</Badge>}
              </div>
              <div className={styles.messageBody}>{v.text}</div>
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>예상 오픈율</span>
                  <span className={styles.statValuePri}>
                    {v.predictedOpenRate}%
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>예상 클릭률</span>
                  <span className={styles.statValueOk}>
                    {v.predictedClickRate}%
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>글자수</span>
                  <span className={styles.statValueNeutral}>
                    {v.charCount}자
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnOutline}
          onClick={onReset}
        >
          🔄 다시 설정하기
        </button>
        <button
          type="button"
          className={styles.btnOutline}
          onClick={onRegenerate}
        >
          ✨ 다른 변형 생성
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onSend}
        >
          📤 선택한 메시지로 발송하기
        </button>
      </div>
    </>
  );
}
