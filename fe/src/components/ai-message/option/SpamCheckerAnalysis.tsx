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

function getRiskLevelColor(level: SpamRiskLevel): 'green' | 'yellow' | 'red' {
  if (level === 'safe') return 'green';
  if (level === 'warning') return 'yellow';
  return 'red';
}

function VariantResult({ result }: { result: SpamCheckerVariantResult }) {
  const color = getRiskLevelColor(result.risk_level);

  const badgeClass = [
    styles.riskBadge,
    color === 'green'
      ? styles.riskBadgeGreen
      : color === 'yellow'
        ? styles.riskBadgeYellow
        : styles.riskBadgeRed,
  ].join(' ');

  return (
    <div className={styles.variantBlock}>
      <div className={styles.variantHeader}>
        <span className={styles.variantLabel}>{result.label}안</span>
        <span className={badgeClass}>
          {RISK_LEVEL_ICONS[result.risk_level]} {CLASSIFICATION_LABELS[result.classification] ?? result.classification}
        </span>
      </div>

      {/* Ad compliance */}
      <div className={styles.complianceRow}>
        <span className={styles.complianceIcon}>
          {result.ad_compliance.has_ad_label ? '✅' : '❌'}
        </span>
        <span className={styles.complianceText}>(광고) 표기</span>
        <span className={styles.complianceIcon}>
          {result.ad_compliance.has_opt_out_number ? '✅' : '❌'}
        </span>
        <span className={styles.complianceText}>무료거부 번호</span>
      </div>

      {/* Risk factors */}
      {result.risk_factors.length > 0 && (
        <div className={styles.factorsSection}>
          <div className={styles.factorsTitle}>위험 요소</div>
          {result.risk_factors.map((factor, idx) => (
            <div key={`${factor.keyword}-${idx}`} className={styles.factorRow}>
              <span className={styles.factorKeyword}>{factor.keyword}</span>
              <span className={styles.factorCategory}>{factor.category}</span>
              <span className={
                factor.severity === 'high'
                  ? styles.factorSeverityHigh
                  : factor.severity === 'medium'
                    ? styles.factorSeverityMedium
                    : styles.factorSeverityLow
              }>
                {SEVERITY_LABELS[factor.severity] ?? factor.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <div className={styles.suggestionsTitle}>💡 개선 제안</div>
          <ul className={styles.suggestionsList}>
            {result.suggestions.map((suggestion, idx) => (
              <li key={idx} className={styles.suggestionItem}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SingleResult({ data }: { data: SpamCheckerResult }) {
  const riskLevel = data.risk_level ?? 'safe';
  const classification = data.classification ?? 'HAM';
  const color = getRiskLevelColor(riskLevel);

  const badgeClass = [
    styles.riskBadge,
    color === 'green'
      ? styles.riskBadgeGreen
      : color === 'yellow'
        ? styles.riskBadgeYellow
        : styles.riskBadgeRed,
  ].join(' ');

  return (
    <div className={styles.variantBlock}>
      <div className={styles.variantHeader}>
        <span className={styles.variantLabel}>분석 결과</span>
        <span className={badgeClass}>
          {RISK_LEVEL_ICONS[riskLevel]} {CLASSIFICATION_LABELS[classification] ?? classification}
        </span>
      </div>

      {data.ad_compliance && (
        <div className={styles.complianceRow}>
          <span className={styles.complianceIcon}>
            {data.ad_compliance.has_ad_label ? '✅' : '❌'}
          </span>
          <span className={styles.complianceText}>(광고) 표기</span>
          <span className={styles.complianceIcon}>
            {data.ad_compliance.has_opt_out_number ? '✅' : '❌'}
          </span>
          <span className={styles.complianceText}>무료거부 번호</span>
        </div>
      )}

      {data.risk_factors && data.risk_factors.length > 0 && (
        <div className={styles.factorsSection}>
          <div className={styles.factorsTitle}>위험 요소</div>
          {data.risk_factors.map((factor, idx) => (
            <div key={`${factor.keyword}-${idx}`} className={styles.factorRow}>
              <span className={styles.factorKeyword}>{factor.keyword}</span>
              <span className={styles.factorCategory}>{factor.category}</span>
              <span className={
                factor.severity === 'high'
                  ? styles.factorSeverityHigh
                  : factor.severity === 'medium'
                    ? styles.factorSeverityMedium
                    : styles.factorSeverityLow
              }>
                {SEVERITY_LABELS[factor.severity] ?? factor.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {data.suggestions && data.suggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <div className={styles.suggestionsTitle}>💡 개선 제안</div>
          <ul className={styles.suggestionsList}>
            {data.suggestions.map((suggestion, idx) => (
              <li key={idx} className={styles.suggestionItem}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SpamCheckerAnalysis({ data }: SpamCheckerAnalysisProps) {
  const hasVariants = data.results && data.results.length > 0;
  const overallLevel = data.overall_risk_level ?? data.risk_level ?? 'safe';
  const overallClassification = data.overall_classification ?? data.classification ?? 'HAM';
  const color = getRiskLevelColor(overallLevel);

  const overallBadgeClass = [
    styles.overallBadge,
    color === 'green'
      ? styles.overallBadgeGreen
      : color === 'yellow'
        ? styles.overallBadgeYellow
        : styles.overallBadgeRed,
  ].join(' ');

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div className={styles.title}>
          🛡️ KISA 스팸 분석 <Badge variant="ai">AI</Badge>
        </div>
        <span className={overallBadgeClass}>
          {RISK_LEVEL_ICONS[overallLevel]} {RISK_LEVEL_LABELS[overallLevel]} — {CLASSIFICATION_LABELS[overallClassification] ?? overallClassification}
        </span>
      </div>

      {hasVariants
        ? data.results!.map((result) => (
            <VariantResult key={result.label} result={result} />
          ))
        : <SingleResult data={data} />
      }
    </div>
  );
}
