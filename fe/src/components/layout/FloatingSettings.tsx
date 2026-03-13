'use client';

import { useState } from 'react';
import { useSettings, ThemeName, AgentMode } from '@/context/SettingsContext';
import styles from './FloatingSettings.module.css';

const MODELS = [
  { id: 'us.anthropic.claude-sonnet-4-20250514-v1:0', label: 'Claude Sonnet 4' },
  { id: 'us.anthropic.claude-3-5-haiku-20241022-v1:0', label: 'Claude Haiku 3.5' },
  { id: 'us.amazon.nova-pro-v1:0', label: 'Amazon Nova Pro' },
  { id: 'us.amazon.nova-lite-v1:0', label: 'Amazon Nova Lite' },
] as const;

const THEMES: { name: ThemeName; label: string; color: string }[] = [
  { name: 'sendon', label: 'Sendon', color: '#6C5CE7' },
  { name: 'toss', label: 'Toss', color: '#0064FF' },
  { name: 'retro', label: 'Retro', color: '#00FF41' },
  { name: 'dark', label: 'Dark', color: '#1a1a2e' },
  { name: 'pastel', label: 'Pastel', color: '#FFB3C6' },
];

export default function FloatingSettings() {
  const [open, setOpen] = useState(false);
  const { agentMode, modelId, theme, spamCheckEnabled, purposeSelectorEnabled, setAgentMode, setModelId, setTheme, setSpamCheckEnabled, setPurposeSelectorEnabled } = useSettings();

  return (
    <div className={styles.container}>
      {open && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>개발용 설정</p>

          {/* Agent Mode */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>에이전트 모드</p>
            <div className={styles.modeToggle}>
              {(['single', 'multi'] as AgentMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`${styles.modeBtn} ${agentMode === mode ? styles.active : ''}`}
                  onClick={() => setAgentMode(mode)}
                >
                  {mode === 'single' ? 'Single' : 'Multi'}
                </button>
              ))}
            </div>
          </div>

          {/* Spam Check */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>KISA 스팸 분석</p>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeBtn} ${spamCheckEnabled ? styles.active : ''}`}
                onClick={() => setSpamCheckEnabled(true)}
              >
                ON
              </button>
              <button
                className={`${styles.modeBtn} ${!spamCheckEnabled ? styles.active : ''}`}
                onClick={() => setSpamCheckEnabled(false)}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Purpose Selector */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>메시지 목적 선택</p>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeBtn} ${purposeSelectorEnabled ? styles.active : ''}`}
                onClick={() => setPurposeSelectorEnabled(true)}
              >
                ON
              </button>
              <button
                className={`${styles.modeBtn} ${!purposeSelectorEnabled ? styles.active : ''}`}
                onClick={() => setPurposeSelectorEnabled(false)}
              >
                OFF
              </button>
            </div>
          </div>

          {/* LLM Model */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>LLM 모델</p>
            <select
              className={styles.modelSelect}
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>테마</p>
            <div className={styles.themeGrid}>
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  className={`${styles.themeBtn} ${theme === t.name ? styles.activeTheme : ''}`}
                  onClick={() => setTheme(t.name)}
                  title={t.label}
                >
                  <span
                    className={styles.themeDot}
                    style={{ backgroundColor: t.color }}
                  />
                  <span className={styles.themeLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        className={styles.toggleBtn}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="개발용 설정 열기"
        title="개발용 설정"
      >
        ⚙️
      </button>
    </div>
  );
}
