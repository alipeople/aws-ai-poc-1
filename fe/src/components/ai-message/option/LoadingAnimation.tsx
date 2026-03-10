'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './LoadingAnimation.module.css';

const LOADING_STEPS = [
  '톤앤매너 분석 중',
  '상품 정보 반영 중',
  '시즌 키워드 삽입 중',
  'A/B 변형 생성 중',
  '스팸 점수 검증 중',
] as const;

const STEP_DELAY_MS = 1500;

export interface LoadingAnimationProps {
  isVisible: boolean;
}

export function LoadingAnimation({ isVisible }: LoadingAnimationProps) {
  const [activeStep, setActiveStep] = useState(-1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Cleanup previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (isVisible) {
      setActiveStep(-1);
      LOADING_STEPS.forEach((_, idx) => {
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
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <div className={styles.heading}>AI가 메시지를 생성하고 있어요</div>
      <div className={styles.steps}>
        {LOADING_STEPS.map((label, idx) => {
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
