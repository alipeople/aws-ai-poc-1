'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AgentMode = 'single' | 'multi';

export type ThemeName = 'sendon' | 'toss' | 'retro' | 'dark' | 'pastel';

export interface SettingsState {
  agentMode: AgentMode;
  modelId: string;
  theme: ThemeName;
  spamCheckEnabled: boolean;
  purposeSelectorEnabled: boolean;
}

export interface SettingsContextValue extends SettingsState {
  setAgentMode: (mode: AgentMode) => void;
  setModelId: (modelId: string) => void;
  setTheme: (theme: ThemeName) => void;
  setSpamCheckEnabled: (enabled: boolean) => void;
  setPurposeSelectorEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'sendon-ai-studio-settings';

const DEFAULT_SETTINGS: SettingsState = {
  agentMode: 'single',
  modelId: 'apac.anthropic.claude-sonnet-4-20250514-v1:0',
  theme: 'sendon',
  spamCheckEnabled: true,
  purposeSelectorEnabled: true,
};

// Known valid model ID prefixes for the current AWS region (ap-northeast-2).
// us.* prefixes are NOT valid — they were used in a previous configuration.
const VALID_MODEL_PREFIXES = ['apac.', 'global.'];

function isValidModelId(modelId: string): boolean {
  return VALID_MODEL_PREFIXES.some((p) => modelId.startsWith(p));
}

function loadFromStorage(): SettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const stored = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    // Reset stale model IDs (e.g. us.* from previous config)
    if (!isValidModelId(stored.modelId)) {
      stored.modelId = DEFAULT_SETTINGS.modelId;
    }
    return stored;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveToStorage(settings: SettingsState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

export const SettingsContext = createContext<SettingsContextValue>({
  ...DEFAULT_SETTINGS,
  setAgentMode: () => {},
  setModelId: () => {},
  setTheme: () => {},
  setSpamCheckEnabled: () => {},
  setPurposeSelectorEnabled: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = loadFromStorage();
    setSettings(stored);
    applyTheme(stored.theme);
  }, []);

  const setAgentMode = (mode: AgentMode) => {
    setSettings((prev) => {
      const next = { ...prev, agentMode: mode };
      saveToStorage(next);
      return next;
    });
  };

  const setModelId = (modelId: string) => {
    setSettings((prev) => {
      const next = { ...prev, modelId };
      saveToStorage(next);
      return next;
    });
  };

  const setTheme = (theme: ThemeName) => {
    applyTheme(theme);
    setSettings((prev) => {
      const next = { ...prev, theme };
      saveToStorage(next);
      return next;
    });
  };

  const setSpamCheckEnabled = (enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, spamCheckEnabled: enabled };
      saveToStorage(next);
      return next;
    });
  };

  const setPurposeSelectorEnabled = (enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, purposeSelectorEnabled: enabled };
      saveToStorage(next);
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ ...settings, setAgentMode, setModelId, setTheme, setSpamCheckEnabled, setPurposeSelectorEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
