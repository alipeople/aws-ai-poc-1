'use client';

import React, { useRef, useCallback } from 'react';
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

function checkAdLabel(text: string): boolean {
  return text.trimStart().startsWith('(광고)');
}

function checkOptOut(text: string): boolean {
  return /무료거부\s*0\d{2}/.test(text);
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

export interface ResultCardsProps {
  variants: MessageVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onVariantTextChange?: (index: number, newText: string) => void;
  onReanalyzeSpam?: (index: number, text: string) => void;
  onReset?: () => void;
  onRegenerate?: () => void;
  onSend?: () => void;
  images?: string[];
  spamBlocked?: boolean;
}

export function ResultCards({
  variants,
  selectedIndex,
  onSelect,
  onVariantTextChange,
  onReanalyzeSpam,
  onReset,
  onRegenerate,
  onSend,
  images,
  spamBlocked,
}: ResultCardsProps) {
  const items = variants.length > 0 ? variants : MOCK_VARIANTS;
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const handleTextChange = useCallback(
    (i: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
      autoResize(e.target);
      onVariantTextChange?.(i, e.target.value);
    },
    [onVariantTextChange],
  );

  const setTextareaRef = useCallback(
    (i: number) => (el: HTMLTextAreaElement | null) => {
      textareaRefs.current[i] = el;
      if (el) {
        // Auto-resize on mount
        requestAnimationFrame(() => autoResize(el));
      }
    },
    [],
  );

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

          const hasAdLabel = checkAdLabel(v.text);
          const hasOptOut = checkOptOut(v.text);
          const charCount = v.text.length;

          return (
            <div key={v.label} className={cls} onClick={() => onSelect(i)}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>
                  {v.label}안 — {v.title}
                </span>
                {i === 0 && <Badge variant="ai">✨ AI 추천</Badge>}
              </div>
              <div className={styles.messageBody}>
                {images && images.length > 0 && (
                  <div className={styles.mmsImageStrip}>
                    {images.map((src, idx) => (
                      <img key={idx} src={src} alt={`MMS ${idx + 1}`} className={styles.mmsImage} />
                    ))}
                  </div>
                )}
                <textarea
                  ref={setTextareaRef(i)}
                  className={styles.editableText}
                  value={v.text}
                  onChange={(e) => handleTextChange(i, e)}
                  onClick={(e) => e.stopPropagation()}
                  rows={3}
                />
                <div className={styles.complianceBar} onClick={(e) => e.stopPropagation()}>
                  <span className={hasAdLabel ? styles.complianceOk : styles.complianceFail}>
                    {hasAdLabel ? '✅' : '❌'} 광고표기
                  </span>
                  <span className={hasOptOut ? styles.complianceOk : styles.complianceFail}>
                    {hasOptOut ? '✅' : '❌'} 수신거부
                  </span>
                  <span className={styles.complianceCount}>{charCount}자</span>
                  {onReanalyzeSpam && (
                    <button
                      type="button"
                      className={styles.reanalyzeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReanalyzeSpam(i, v.text);
                      }}
                    >
                      🔍 스팸 재분석
                    </button>
                  )}
                </div>
              </div>
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
                    {charCount}자
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
          disabled={spamBlocked}
        >
          👥 누구에게 보낼까요?
        </button>
      </div>
      {spamBlocked && (
        <div className={styles.spamWarning}>
          🚫 스팸으로 판정된 메시지는 다음 단계로 진행할 수 없습니다
        </div>
      )}
    </>
  );
}
