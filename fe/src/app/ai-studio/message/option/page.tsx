'use client';

import React, { useState, useCallback } from 'react';
import { ChannelSelector } from '@/components/ai-message/option/ChannelSelector';
import { PurposeSelector } from '@/components/ai-message/option/PurposeSelector';
import { ToneSelector } from '@/components/ai-message/option/ToneSelector';
import { SourceInput } from '@/components/ai-message/option/SourceInput';
import { SeasonSelector } from '@/components/ai-message/option/SeasonSelector';
import { TargetSelector } from '@/components/ai-message/option/TargetSelector';
import { SummaryPanel } from '@/components/ai-message/option/SummaryPanel';
import { GenerateButton } from '@/components/ai-message/option/GenerateButton';
import { LoadingAnimation } from '@/components/ai-message/option/LoadingAnimation';
import styles from './page.module.css';

const MOCK_GENERATION_TIME_MS = 8000;

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

  const handleGenerate = useCallback(() => {
    setIsLoading(true);
    setShowResults(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, MOCK_GENERATION_TIME_MS);
  }, []);

  // Derive summary source text for SummaryPanel
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

        {/* Results placeholder — Task 16 will render here when showResults === true */}
        {showResults && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--tx2)', fontSize: 14 }}>
            생성 완료! (결과 컴포넌트는 Task 16에서 구현 예정)
          </div>
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
