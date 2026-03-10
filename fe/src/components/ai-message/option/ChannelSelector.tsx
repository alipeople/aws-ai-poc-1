'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import styles from './StepHeader.module.css';

const CHANNELS = [
  { id: 'sms', label: 'SMS', icon: '📱' },
  { id: 'lms', label: 'LMS', icon: '📝' },
  { id: 'mms', label: 'MMS', icon: '🖼️' },
  { id: 'alimtalk', label: '알림톡', icon: '💬' },
  { id: 'brand', label: '브랜드', icon: '🏷️' },
  { id: 'rcs', label: 'RCS', icon: '📨' },
] as const;

export interface ChannelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
  return (
    <Card>
      <div className={styles.header}>① 채널 선택</div>
      <div className={styles.chipGrid}>
        {CHANNELS.map((ch) => (
          <Chip
            key={ch.id}
            icon={ch.icon}
            label={ch.label}
            selected={value === ch.id}
            onClick={() => onChange(ch.id)}
          />
        ))}
      </div>
    </Card>
  );
}
