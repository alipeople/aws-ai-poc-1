'use client';

import React from 'react';
import Markdown from 'react-markdown';
import styles from './MessageBubble.module.css';

export interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, agentName, isStreaming }: MessageBubbleProps) {
  const isAi = role === 'assistant';
  const bubbleClass = `${styles.bubble} ${isAi ? styles.bubbleAi : styles.bubbleUser}`;

  return (
    <div className={bubbleClass}>
      <div className={styles.avatar}>{isAi ? '✨' : '👤'}</div>
      <div>
        {isAi && agentName && (
          <div className={styles.agentLabel}>{agentName}</div>
        )}
        <div className={styles.content}>
          {isAi ? (
            <Markdown>{content}</Markdown>
          ) : (
            content
          )}
          {isStreaming && <span className={styles.cursor} />}
        </div>
      </div>
    </div>
  );
}
