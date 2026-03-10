'use client';

import React from 'react';
import styles from './SummaryPanel.module.css';

const CHANNEL_LABELS: Record<string, string> = {
  sms: 'SMS',
  lms: 'LMS',
  mms: 'MMS',
  alimtalk: '알림톡',
  brand: '브랜드',
  rcs: 'RCS',
};

const PURPOSE_LABELS: Record<string, string> = {
  promotion: '프로모션/할인',
  notice: '안내/공지',
  event: '이벤트 초대',
  reminder: '리마인더',
  review: '리뷰 요청',
  greeting: '인사/감사',
};

const TONE_LABELS: Record<string, string> = {
  friendly: '😊 친근체',
  formal: '🎩 격식체',
  humor: '😎 캐주얼',
  emotional: '💜 감성체',
  urgent: '🔥 긴급',
};

const SEASON_LABELS: Record<string, string> = {
  spring: '🌸 봄맞이',
  whiteday: '🤍 화이트데이',
  easter: '🐣 부활절',
  parents: '💐 어버이날',
  summer: '☀️ 여름',
  chuseok: '🌕 추석',
  christmas: '🎄 크리스마스',
  yearend: '🎊 연말',
  newyear: '🎍 설날',
};

const TARGET_LABELS: Record<string, string> = {
  all: '전체 발송',
  addressbook: '주소록 선택',
  'ai-recommend': 'AI 추천 타겟',
};

const SEND_TIME_LABELS: Record<string, string> = {
  now: '즉시 발송',
  scheduled: '예약 발송',
  'ai-time': 'AI 추천 시간',
};

export interface SummaryPanelProps {
  channel: string;
  purpose: string;
  tone: string;
  source: string;
  season: string;
  target: string;
  sendTime: string;
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={value ? styles.value : `${styles.value} ${styles.empty}`}>
        {value || '미선택'}
      </span>
    </div>
  );
}

export function SummaryPanel({
  channel,
  purpose,
  tone,
  source,
  season,
  target,
  sendTime,
}: SummaryPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.title}>설정 요약</div>

      <SummaryRow label="채널" value={CHANNEL_LABELS[channel] || ''} />
      <SummaryRow label="목적" value={PURPOSE_LABELS[purpose] || ''} />
      <SummaryRow label="톤앤매너" value={TONE_LABELS[tone] || ''} />
      <SummaryRow
        label="소재"
        value={source ? (source.length > 20 ? source.slice(0, 20) + '…' : source) : ''}
      />
      <SummaryRow label="시즌" value={SEASON_LABELS[season] || ''} />
      <SummaryRow label="대상" value={TARGET_LABELS[target] || ''} />
      <SummaryRow label="발송 시간" value={SEND_TIME_LABELS[sendTime] || ''} />

      <div className={styles.tip}>
        <div className={styles.tipTitle}>💡 Tip</div>
        <div className={styles.tipText}>
          톤앤매너 + 상품 URL + 시즌을 모두 설정하면 가장 높은 품질의 메시지가 생성됩니다.
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featuresTitle}>포함 AI 기능</div>
        <div className={styles.featuresList}>
          🔀 A/B 변형 3종 자동 생성
          <br />
          🛡️ 스팸 점수 사전 예측
          <br />
          👤 개인화 변수 자동 삽입
          <br />
          😴 수신자 피로도 체크
        </div>
      </div>
    </div>
  );
}
