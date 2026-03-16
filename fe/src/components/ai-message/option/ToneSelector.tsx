'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import styles from './StepHeader.module.css';

const TONES = [
  { id: 'friendly', label: '친근체', icon: '😊' },
  { id: 'formal', label: '격식체', icon: '🎩' },
  { id: 'humor', label: '캐주얼', icon: '😎' },
  { id: 'emotional', label: '감성체', icon: '💜' },
  { id: 'urgent', label: '긴급', icon: '🔥' },
  { id: 'kind', label: '친절한', icon: '🤗' },
  { id: 'caring', label: '세심한', icon: '💝' },
  { id: 'professional', label: '전문적', icon: '💼' },
  { id: 'witty', label: '위트있는', icon: '😄' },
  { id: 'warm', label: '따뜻한', icon: '🌷' },
  { id: 'concise', label: '간결한', icon: '✂️' },
] as const;

interface PastMessage {
  date: string;
  channel: string;
  content: string;
  selected: boolean;
}

const MOCK_PAST_MESSAGES: PastMessage[] = [
  {
    date: '03.01',
    channel: 'SMS',
    content: '[센드온] 3월 한정! 신규가입 시 첫 발송 50% 할인.',
    selected: true,
  },
  {
    date: '02.25',
    channel: '알림톡',
    content: '{{고객명}}님, 2월 마지막 주 특별 혜택을 준비했어요 🎁',
    selected: false,
  },
  {
    date: '02.20',
    channel: 'RCS',
    content: '[센드온 이벤트] 친구 추천하면 크레딧 2배!',
    selected: false,
  },
];

export interface ToneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  aiMode: boolean;
  onAiModeChange: (value: boolean) => void;
}

export function ToneSelector({
  value,
  onChange,
  aiMode,
  onAiModeChange,
}: ToneSelectorProps) {
  return (
    <Card glow={aiMode}>
      {/* Toggle row */}
      <div className={styles.toneToggleRow}>
        <div className={styles.toneToggleInfo}>
          <div className={styles.header} style={{ marginBottom: 0 }}>
            ③ 기존 메시지 톤앤매너 분석{' '}
            <Badge variant="ai">AI</Badge>
          </div>
          <div className={styles.description} style={{ marginTop: 4, marginBottom: 0 }}>
            과거 발송 메시지를 분석해 동일한 어조로 생성합니다
          </div>
        </div>
        <Toggle checked={aiMode} onChange={onAiModeChange} />
      </div>

      {/* AI analysis body (shown when toggle ON) */}
      {aiMode && (
        <div className={styles.toneAiBody}>
          <div className={styles.toneAiLabel}>
            최근 발송 메시지 (선택하면 해당 톤을 학습합니다)
          </div>
          {MOCK_PAST_MESSAGES.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.pastMsg} ${msg.selected ? styles.pastMsgSelected : ''}`}
            >
              <div className={styles.pastMsgMeta}>
                <span className={styles.pastMsgDate}>{msg.date}</span>
                <Badge variant="ai">{msg.channel}</Badge>
                {msg.selected && (
                  <span className={styles.pastMsgCheck}>✓ 선택됨</span>
                )}
              </div>
              <div className={styles.pastMsgContent}>{msg.content}</div>
            </div>
          ))}
          <div className={styles.toneAiResult}>
            <div className={styles.toneAiResultTitle}>✨ 분석된 톤앤매너</div>
            <div className={styles.toneAiResultText}>
              친근한 어투 · 이모지 활용 · 직접적 CTA · 60~90자
            </div>
          </div>
        </div>
      )}

      {/* Manual tone selection (shown when toggle OFF) */}
      {!aiMode && (
        <div className={styles.toneManual}>
          <div className={styles.toneManualLabel}>
            또는 톤을 직접 선택하세요
          </div>
          <div className={styles.chipGrid}>
            {TONES.map((t) => (
              <Chip
                key={t.id}
                icon={t.icon}
                label={t.label}
                selected={value === t.id}
                onClick={() => onChange(t.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manual tone fallback (shown when toggle ON) */}
      {aiMode && (
        <div className={styles.toneManual}>
          <div className={styles.toneManualLabel}>
            마음에 드는 톤이 없다면 직접 선택하세요
          </div>
          <div className={styles.chipGrid}>
            {TONES.map((t) => (
              <Chip
                key={t.id}
                icon={t.icon}
                label={t.label}
                selected={value === t.id}
                onClick={() => onChange(t.id)}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
