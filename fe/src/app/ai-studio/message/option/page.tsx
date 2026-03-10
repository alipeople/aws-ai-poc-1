'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { MessageVariant, SpamCheck, PersonalizationVar } from '@/types/api';
import { useSSE } from '@/hooks/useSSE';
import { useSettings } from '@/context/SettingsContext';
import { api } from '@/services/api';
import { ChannelSelector } from '@/components/ai-message/option/ChannelSelector';
import { PurposeSelector } from '@/components/ai-message/option/PurposeSelector';
import { ToneSelector } from '@/components/ai-message/option/ToneSelector';
import { SourceInput } from '@/components/ai-message/option/SourceInput';
import { SeasonSelector } from '@/components/ai-message/option/SeasonSelector';
import { TargetSelector } from '@/components/ai-message/option/TargetSelector';
import { SummaryPanel } from '@/components/ai-message/option/SummaryPanel';
import { GenerateButton } from '@/components/ai-message/option/GenerateButton';
import { LoadingAnimation } from '@/components/ai-message/option/LoadingAnimation';
import { ResultCards } from '@/components/ai-message/option/ResultCards';
import { SpamScore } from '@/components/ai-message/option/SpamScore';
import { PersonalizationVars } from '@/components/ai-message/option/PersonalizationVars';
import { FatigueAlert } from '@/components/ai-message/option/FatigueAlert';
import styles from './page.module.css';

export default function OptionPage() {
  // Step values
  const [channel, setChannel] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('');
  const [aiMode, setAiMode] = useState(true);
  const [source, setSource] = useState('');
  const [sourceType, setSourceType] = useState<'direct' | 'url' | 'past'>('direct');
  const [sourceUrl, setSourceUrl] = useState('');
  const [season, setSeason] = useState('');
  const [target, setTarget] = useState('');
  const [sendTime, setSendTime] = useState('');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [variants, setVariants] = useState<MessageVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [spamScore, setSpamScore] = useState<{ score: number; checks: SpamCheck[] } | null>(null);
  const [personalizationVars, setPersonalizationVars] = useState<PersonalizationVar[]>([]);
  const [fatigueData, setFatigueData] = useState<{ count: number; rate: number; recommendation: string } | null>(null);

  const accumulatedTextRef = useRef('');
  const { streamSSE } = useSSE();
  const { agentMode, modelId } = useSettings();

  const fetchMockData = useCallback(async () => {
    try {
      const [spam, vars, fatigue] = await Promise.all([
        api.mockData.getSpamScore(source || '테스트 메시지'),
        api.mockData.getPersonalizationVars(),
        api.mockData.getFatigueAnalysis(target || '전체'),
      ]);
      setSpamScore(spam as { score: number; checks: SpamCheck[] });
      setPersonalizationVars(vars as PersonalizationVar[]);
      setFatigueData(fatigue as { count: number; rate: number; recommendation: string });
    } catch {
      // Mock data failure is non-critical
    }
  }, [source, target]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setShowResults(false);
    setError(null);
    accumulatedTextRef.current = '';
    setLoadingStep('메시지를 생성하고 있습니다...');

    await streamSSE(
      api.generateMessagesUrl(),
      api.buildGenerateBody({
        channel: (channel || 'SMS') as Parameters<typeof api.buildGenerateBody>[0]['channel'],
        purpose: (purpose || '프로모션') as Parameters<typeof api.buildGenerateBody>[0]['purpose'],
        tone: (tone || '친근체') as Parameters<typeof api.buildGenerateBody>[0]['tone'],
        source: source || '봄맞이 할인',
        sourceType: sourceType,
        season,
        target,
        sendTime,
        agentMode,
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
              if (parsed.variants && Array.isArray(parsed.variants)) {
                setVariants(parsed.variants as MessageVariant[]);
              }
            } catch {
              // Result parsing failure — will use mock variants
            }
          } else if (event.type === 'error') {
            setError(typeof event.data === 'string' ? event.data : '생성 중 오류가 발생했습니다.');
          }
        },
        onComplete: () => {
          setIsLoading(false);
          setShowResults(true);
          void fetchMockData();
        },
        onError: (err) => {
          setIsLoading(false);
          setError(err.message);
        },
      }
    );
  }, [channel, purpose, tone, source, sourceType, season, target, sendTime, agentMode, modelId, streamSSE, fetchMockData]);

  const handleUrlAnalyze = useCallback(async () => {
    if (!sourceUrl) return;
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
    } catch {
      // URL analysis failure — user can type manually
    }
  }, [sourceUrl]);

  const summarySource = sourceType === 'url' ? sourceUrl : source;

  return (
    <div className={styles.layout}>
      {/* Left column: wizard steps + generate button */}
      <div className={styles.steps}>
        <ChannelSelector value={channel} onChange={setChannel} />
        <PurposeSelector value={purpose} onChange={setPurpose} />
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
        />
        <SeasonSelector value={season} onChange={setSeason} />
        <TargetSelector
          target={target}
          onTargetChange={setTarget}
          sendTime={sendTime}
          onSendTimeChange={setSendTime}
        />

        <GenerateButton onClick={handleGenerate} isLoading={isLoading} />
        <LoadingAnimation isVisible={isLoading} />

        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--accO)', borderRadius: 'var(--radius)', color: 'var(--tx)', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {showResults && (
          <>
            <ResultCards
              variants={variants}
              selectedIndex={selectedVariantIndex}
              onSelect={setSelectedVariantIndex}
              onReset={() => { setShowResults(false); setVariants([]); }}
              onRegenerate={handleGenerate}
            />
            {spamScore && (
              <SpamScore score={spamScore.score} checks={spamScore.checks} />
            )}
            {personalizationVars.length > 0 && (
              <PersonalizationVars
                vars={personalizationVars}
                onInsert={(template) => setSource((prev) => prev + ' ' + template)}
              />
            )}
            {fatigueData && (
              <FatigueAlert
                count={fatigueData.count}
                rate={fatigueData.rate}
                recommendation={fatigueData.recommendation}
              />
            )}
          </>
        )}
      </div>

      {/* Right column: sticky summary panel */}
      <div className={styles.sidebar}>
        <SummaryPanel
          channel={channel}
          purpose={purpose}
          tone={tone}
          source={summarySource}
          season={season}
          target={target}
          sendTime={sendTime}
        />
      </div>
    </div>
  );
}
