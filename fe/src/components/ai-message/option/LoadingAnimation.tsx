'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { AgentMode } from '@/types/api';
import styles from './LoadingAnimation.module.css';

const SINGLE_STEPS = [
  '소재를 분석하고 있어요',
  '메시지를 작성하고 있어요',
  'A/B/C 변형을 만들고 있어요',
] as const;

const MULTI_STEPS = [
  '메시지 초안을 작성하고 있어요',
  '작성된 메시지를 검토하고 있어요',
  'A/B/C 변형을 다듬고 있어요',
] as const;

const HEADINGS: Record<AgentMode, string> = {
  single: 'AI가 메시지를 생성하고 있어요',
  multi: 'AI가 메시지를 생성하고 검토하고 있어요',
};

const STEP_DELAY_MS = 1500;

export interface LoadingAnimationProps {
  isVisible: boolean;
  agentMode?: AgentMode;
  spamCheckEnabled?: boolean;
}

export function LoadingAnimation({ isVisible, agentMode = 'single', spamCheckEnabled }: LoadingAnimationProps) {
  const [activeStep, setActiveStep] = useState(-1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const baseSteps = agentMode === 'multi' ? MULTI_STEPS : SINGLE_STEPS;
  const steps = spamCheckEnabled
    ? [...baseSteps, '스팸 규정을 확인하고 있어요']
    : [...baseSteps];

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (isVisible) {
      setActiveStep(-1);
      steps.forEach((_, idx) => {
        const timer = setTimeout(() => {
          setActiveStep(idx);
        }, STEP_DELAY_MS * (idx + 1));
        timersRef.current.push(timer);
      });
    } else {
      setActiveStep(-1);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, agentMode, spamCheckEnabled]);

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <div className={styles.heading}>{HEADINGS[agentMode]}</div>
      <div className={styles.steps}>
        {steps.map((label, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx <= activeStep;
          return (
            <div
              key={label}
              className={[
                styles.step,
                isActive ? styles.stepVisible : '',
                isDone ? styles.stepDone : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.stepIcon}>{isDone ? '✅' : '⏳'}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
