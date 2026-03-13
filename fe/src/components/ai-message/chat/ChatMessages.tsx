'use client';

import React, { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/api';
import { MessageBubble } from './MessageBubble';
import styles from './ChatMessages.module.css';

export interface ChatMessagesProps {
  messages: ChatMessageType[];
  streamingContent?: string;
}

export function ChatMessages({ messages, streamingContent }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className={styles.container}>
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} role={msg.role} content={msg.content} />
      ))}
      {streamingContent !== undefined && streamingContent !== '' && (
        <MessageBubble
          role="assistant"
          content={streamingContent}
          isStreaming
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
