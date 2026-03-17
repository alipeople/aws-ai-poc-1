'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import styles from './StepHeader.module.css';

type SourceType = 'direct' | 'url' | 'past';

const SOURCE_TABS: { id: SourceType; label: string; icon: string }[] = [
  { id: 'direct', label: '직접 입력', icon: '✏️' },
  { id: 'url', label: '제품 링크', icon: '🔗' },
  { id: 'past', label: '과거 문구', icon: '📋' },
];

export interface SourceInputProps {
  value: string;
  onChange: (value: string) => void;
  sourceType: 'direct' | 'url' | 'past';
  onSourceTypeChange: (value: string) => void;
  url: string;
  onUrlChange: (value: string) => void;
  onAnalyzeUrl?: () => void;
  isAnalyzing?: boolean;
}

export function SourceInput({
  value,
  onChange,
  sourceType,
  onSourceTypeChange,
  url,
  onUrlChange,
  onAnalyzeUrl,
  isAnalyzing = false,
}: SourceInputProps) {
  return (
    <Card>
      <div className={styles.header}>① 소재 입력</div>
      <div className={styles.description}>
        직접 입력, 상품 URL 분석, 과거 문구 재활용 중 선택하세요
      </div>

      {/* Tab chips */}
      <div className={styles.tabChips}>
        {SOURCE_TABS.map((tab) => (
          <Chip
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            selected={sourceType === tab.id}
            onClick={() => onSourceTypeChange(tab.id)}
          />
        ))}
      </div>

      {/* Direct input */}
      {sourceType === 'direct' && (
        <textarea
          className={styles.textarea}
          placeholder={
            '프로모션 내용, 상품 정보, 이벤트 내용 등을 자유롭게 입력하세요.\n\n예: 봄맞이 할인 이벤트를 알리는 메시지. 할인율 30%, 무료배송 강조해줘.'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* URL input */}
      {sourceType === 'url' && (
        <div>
          <div className={styles.header} style={{ fontSize: 12, color: 'var(--pri)' }}>
            🔗 상품 URL 분석 <Badge variant="ai">AI</Badge>
          </div>
          <div className={styles.description}>
            카페24, 네이버 브랜드스토어, 11번가 등 대부분의 쇼핑몰 링크를 지원합니다
          </div>
          <div className={styles.urlRow}>
            <input
              className={styles.urlInput}
              placeholder="https://example.com/product/spring-collection"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
            />
            <button
              type="button"
              className={styles.analyzeBtn}
              onClick={onAnalyzeUrl}
              disabled={!url || isAnalyzing}
            >
              {isAnalyzing ? '분석 중...' : '분석하기'}
            </button>
          </div>
        </div>
      )}

      {/* Past messages */}
      {sourceType === 'past' && (
        <div className={styles.pastPlaceholder}>
          과거 발송 문구를 불러오는 중...
        </div>
      )}
    </Card>
  );
}
