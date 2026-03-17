'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { MessageVariant, SpamCheckerResult } from '@/types/api';
import { useSSE } from '@/hooks/useSSE';
import { useSettings } from '@/context/SettingsContext';
import { api } from '@/services/api';
import { ChannelSelector } from '@/components/ai-message/option/ChannelSelector';
import { PurposeSelector } from '@/components/ai-message/option/PurposeSelector';
import { ToneSelector } from '@/components/ai-message/option/ToneSelector';
import { SourceInput } from '@/components/ai-message/option/SourceInput';
import { SeasonSelector } from '@/components/ai-message/option/SeasonSelector';
import { SummaryPanel } from '@/components/ai-message/option/SummaryPanel';
import { GenerateButton } from '@/components/ai-message/option/GenerateButton';
import { LoadingAnimation } from '@/components/ai-message/option/LoadingAnimation';
import { ResultCards } from '@/components/ai-message/option/ResultCards';
import { SpamCheckerAnalysis } from '@/components/ai-message/option/SpamCheckerAnalysis';
import { ImageUploader } from '@/components/ai-message/option/ImageUploader';
import styles from './page.module.css';

export default function OptionPage() {
  // Step values
  const [channel, setChannel] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [source, setSource] = useState('');
  const [sourceType, setSourceType] = useState<'direct' | 'url' | 'past'>('direct');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [season, setSeason] = useState('');
  const [mmsImages, setMmsImages] = useState<string[]>([]);

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [variants, setVariants] = useState<MessageVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [spamCheckerData, setSpamCheckerData] = useState<SpamCheckerResult | null>(null);
  const [detectedPurpose, setDetectedPurpose] = useState<string | null>(null);
  const [detectedChannel, setDetectedChannel] = useState<string | null>(null);
  const [channelReason, setChannelReason] = useState<string | null>(null);
  const [performanceTip, setPerformanceTip] = useState<string | null>(null);

  const accumulatedTextRef = useRef('');
  const hasStreamErrorRef = useRef(false);
  const resultAreaRef = useRef<HTMLDivElement>(null);
  const { streamSSE } = useSSE();
  const { agentMode, modelId, spamCheckEnabled } = useSettings();


  const canGenerate = source.trim().length > 0;

  // Spam block: check selected variant's classification (per-variant) or overall
  const isSpamBlocked = (() => {
    if (!spamCheckerData) return false;
    const variantResults = spamCheckerData.results;
    if (variantResults && variantResults.length > 0) {
      const selected = variantResults[selectedVariantIndex];
      return selected ? selected.classification !== 'HAM' : false;
    }
    const classification = spamCheckerData.overall_classification ?? spamCheckerData.classification;
    return classification ? classification !== 'HAM' : false;
  })();

  const handleGenerate = useCallback(async () => {
    if (!source.trim()) {
      setError('소재/상품 정보를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setShowResults(false);
    setError(null);
    setSpamCheckerData(null);
    setDetectedPurpose(null);
    setDetectedChannel(null);
    setChannelReason(null);
    setPerformanceTip(null);
    accumulatedTextRef.current = '';
    hasStreamErrorRef.current = false;
    setLoadingStep('메시지를 생성하고 있습니다...');
    setTimeout(() => resultAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    await streamSSE(
      api.generateMessagesUrl(),
      api.buildGenerateBody({
        channel: channel as Parameters<typeof api.buildGenerateBody>[0]['channel'],
        purpose: (purpose || '프로모션') as Parameters<typeof api.buildGenerateBody>[0]['purpose'],
        tone: (tone || '친근체') as Parameters<typeof api.buildGenerateBody>[0]['tone'],
        source: source.trim(),
        sourceType: sourceType,
        season,
        agentMode,
        spamCheckEnabled,
        modelId,
      }),
      {
        onChunk: (event) => {
          if (event.type === 'progress' && typeof event.data === 'string') {
            setLoadingStep(event.data);
          } else if (event.type === 'text' && typeof event.data === 'string') {
            accumulatedTextRef.current += event.data;
          } else if (event.type === 'result' && typeof event.data === 'string') {
            try {
              const parsed = JSON.parse(event.data);
              if (event.agentName === 'spam_checker') {
                setSpamCheckerData(parsed as SpamCheckerResult);
              } else if (parsed.variants && Array.isArray(parsed.variants)) {
                setVariants(parsed.variants as MessageVariant[]);
                if (parsed.detectedPurpose) {
                  setDetectedPurpose(parsed.detectedPurpose as string);
                }
                if (parsed.detectedChannel) {
                  setDetectedChannel(parsed.detectedChannel as string);
                }
                if (parsed.channelReason) {
                  setChannelReason(parsed.channelReason as string);
                }
                if (parsed.performanceTip) {
                  setPerformanceTip(parsed.performanceTip as string);
                }
              }
            } catch {
              // Result parsing failure — will use mock variants
            }
          } else if (event.type === 'error') {
            hasStreamErrorRef.current = true;
            setError(typeof event.data === 'string' ? event.data : '생성 중 오류가 발생했습니다.');
          }
        },
        onComplete: () => {
          setIsLoading(false);
          if (!hasStreamErrorRef.current) {
            setShowResults(true);
          }
        },
        onError: (err) => {
          setIsLoading(false);
          setError(err.message);
        },
      }
    );
  }, [channel, purpose, tone, source, sourceType, season, agentMode, spamCheckEnabled, modelId, streamSSE]);

  const handleUrlAnalyze = useCallback(async () => {
    if (!sourceUrl) return;
    setIsAnalyzing(true);
    try {
      const result = await api.analyzeUrl(sourceUrl);
      const summary = [
        result.productName,
        result.price && `가격: ${result.price}`,
        result.discount && `할인: ${result.discount}`,
        result.category && `카테고리: ${result.category}`,
        result.features.length > 0 && `특징: ${result.features.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n');
      setSource(summary);
      setSourceType('direct');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'URL 분석에 실패했습니다.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sourceUrl]);

  const summarySource = sourceType === 'url' ? sourceUrl : source;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>✍️ 메시지 작성하기</h1>
        <p>어떤 메시지를 보낼지 AI와 함께 만들어보세요</p>
      </div>
      <div className={styles.layout}>
      {/* Left column: wizard steps + generate button */}
      <div className={styles.steps}>
        <ChannelSelector value={channel} onChange={setChannel} />
        {channel === 'mms' && <ImageUploader images={mmsImages} onChange={setMmsImages} />}
        <PurposeSelector value={purpose} onChange={setPurpose} />
        <SeasonSelector value={season} onChange={setSeason} />
        <ToneSelector
          value={tone}
          onChange={setTone}
          aiMode={aiMode}
          onAiModeChange={setAiMode}
        />
        <SourceInput
          value={source}
          onChange={setSource}
          sourceType={sourceType}
          onSourceTypeChange={(v) => setSourceType(v as 'direct' | 'url' | 'past')}
          url={sourceUrl}
          onUrlChange={setSourceUrl}
          onAnalyzeUrl={handleUrlAnalyze}
          isAnalyzing={isAnalyzing}
        />

        <div ref={resultAreaRef} />
        <GenerateButton onClick={handleGenerate} isLoading={isLoading} disabled={!canGenerate} />
        <LoadingAnimation isVisible={isLoading} agentMode={agentMode} spamCheckEnabled={spamCheckEnabled} />

        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--accO)', borderRadius: 'var(--radius)', color: 'var(--tx)', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {showResults && (
          <>
            {(detectedChannel || detectedPurpose) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detectedChannel && (
                  <div style={{ padding: '10px 16px', background: 'color-mix(in srgb, var(--ok) 8%, transparent)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--tx2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📡</span>
                    <span>AI 추천 채널: <strong style={{ color: 'var(--tx)' }}>{detectedChannel}</strong></span>
                    {channelReason && <span style={{ fontSize: 12, color: 'var(--tx3)' }}>— {channelReason}</span>}
                  </div>
                )}
                {detectedPurpose && (
                  <div style={{ padding: '10px 16px', background: 'color-mix(in srgb, var(--pri) 8%, transparent)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--tx2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🎯</span>
                    <span>AI 판단 목적: <strong style={{ color: 'var(--tx)' }}>{detectedPurpose}</strong></span>
                  </div>
                )}
              </div>
            )}

            {performanceTip && (
              <div style={{ padding: '12px 16px', background: 'color-mix(in srgb, var(--accY) 10%, transparent)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <span>{performanceTip}</span>
              </div>
            )}

            <ResultCards
              variants={variants}
              selectedIndex={selectedVariantIndex}
              onSelect={setSelectedVariantIndex}
              onReset={() => { setShowResults(false); setVariants([]); setSpamCheckerData(null); setDetectedPurpose(null); setDetectedChannel(null); setChannelReason(null); setPerformanceTip(null); }}
              onRegenerate={handleGenerate}
              images={channel === 'mms' ? mmsImages : undefined}
              spamBlocked={isSpamBlocked}
            />
            {spamCheckerData && (
              <SpamCheckerAnalysis data={spamCheckerData} />
            )}
          </>
        )}
      </div>

      {/* Right column: sticky summary panel */}
      <div className={styles.sidebar}>
        <SummaryPanel
          channel={channel}
          purpose={purpose || detectedPurpose || undefined}
          tone={tone}
          source={summarySource}
          season={season}
          images={channel === 'mms' ? mmsImages : undefined}
        />
      </div>
      </div>
    </div>
  );
}
