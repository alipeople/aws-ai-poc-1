'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { SpamCheckerResult, SpamCheckerVariantResult, SpamRiskLevel } from '@/types/api';
import styles from './SpamCheckerAnalysis.module.css';

export interface SpamCheckerAnalysisProps {
  data: SpamCheckerResult;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  HAM: '정상',
  ILLEGAL_SPAM: '불법 스팸',
  NORMAL_SPAM: '일반 스팸',
  AD_VIOLATION: '광고표기 미준수',
};

const RISK_LEVEL_LABELS: Record<SpamRiskLevel, string> = {
  safe: '안전',
  warning: '주의',
  danger: '위험',
};

const RISK_LEVEL_ICONS: Record<SpamRiskLevel, string> = {
  safe: '✅',
  warning: '⚠️',
  danger: '🚨',
};

const SEVERITY_LABELS: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

function getRiskColor(level: SpamRiskLevel): string {
  if (level === 'safe') return 'green';
  if (level === 'warning') return 'yellow';
  return 'red';
}

/** Compact card for a single variant (A/B/C) */
function VariantCard({ result }: { result: SpamCheckerVariantResult }) {
  const color = getRiskColor(result.risk_level);
  const badgeClass = `${styles.riskBadge} ${styles[`riskBadge_${color}`]}`;

  return (
    <div className={styles.card}>
      {/* Header: label + risk badge */}
      <div className={styles.cardHeader}>
        <span className={styles.cardLabel}>{result.label}안</span>
        <span className={badgeClass}>
          {RISK_LEVEL_ICONS[result.risk_level]} {CLASSIFICATION_LABELS[result.classification] ?? result.classification}
        </span>
      </div>

      {/* Ad compliance */}
      <div className={styles.compliance}>
        <span>{result.ad_compliance.has_ad_label ? '✅' : '❌'} (광고) 표기</span>
        <span>{result.ad_compliance.has_opt_out_number ? '✅' : '❌'} 무료거부</span>
      </div>

      {/* Risk factors (compact) */}
      {result.risk_factors.length > 0 ? (
        <div className={styles.factors}>
          {result.risk_factors.map((f, i) => (
            <span key={i} className={`${styles.factorTag} ${styles[`severity_${f.severity}`]}`}>
              {f.keyword}
              <span className={styles.factorSev}>{SEVERITY_LABELS[f.severity]}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className={styles.noIssue}>위험 요소 없음</div>
      )}

      {/* Suggestions (brief) */}
      {result.suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {result.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Compact card for single-agent result (no variants) */
function SingleCard({ data }: { data: SpamCheckerResult }) {
  const riskLevel = data.risk_level ?? 'safe';
  const classification = data.classification ?? 'HAM';
  const color = getRiskColor(riskLevel);
  const badgeClass = `${styles.riskBadge} ${styles[`riskBadge_${color}`]}`;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardLabel}>분석 결과</span>
        <span className={badgeClass}>
          {RISK_LEVEL_ICONS[riskLevel]} {CLASSIFICATION_LABELS[classification] ?? classification}
        </span>
      </div>

      {data.ad_compliance && (
        <div className={styles.compliance}>
          <span>{data.ad_compliance.has_ad_label ? '✅' : '❌'} (광고) 표기</span>
          <span>{data.ad_compliance.has_opt_out_number ? '✅' : '❌'} 무료거부</span>
        </div>
      )}

      {data.risk_factors && data.risk_factors.length > 0 ? (
        <div className={styles.factors}>
          {data.risk_factors.map((f, i) => (
            <span key={i} className={`${styles.factorTag} ${styles[`severity_${f.severity}`]}`}>
              {f.keyword}
              <span className={styles.factorSev}>{SEVERITY_LABELS[f.severity]}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className={styles.noIssue}>위험 요소 없음</div>
      )}

      {data.suggestions && data.suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {data.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SpamCheckerAnalysis({ data }: SpamCheckerAnalysisProps) {
  const hasVariants = data.results && data.results.length > 0;
  const overallLevel = data.overall_risk_level ?? data.risk_level ?? 'safe';
  const overallClassification = data.overall_classification ?? data.classification ?? 'HAM';
  const color = getRiskColor(overallLevel);
  const overallBadgeClass = `${styles.overallBadge} ${styles[`overallBadge_${color}`]}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <span className={styles.title}>
          🛡️ KISA 스팸 분석 <Badge variant="ai">AI</Badge>
        </span>
        <span className={overallBadgeClass}>
          {RISK_LEVEL_ICONS[overallLevel]} {RISK_LEVEL_LABELS[overallLevel]} — {CLASSIFICATION_LABELS[overallClassification] ?? overallClassification}
        </span>
      </div>

      <div className={hasVariants ? styles.grid : undefined}>
        {hasVariants
          ? data.results!.map((r) => <VariantCard key={r.label} result={r} />)
          : <SingleCard data={data} />
        }
      </div>
    </div>
  );
}
