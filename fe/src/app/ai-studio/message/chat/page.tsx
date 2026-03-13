'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { ChatMessage, SpamCheckerResult } from '@/types/api';
import { useSSE } from '@/hooks/useSSE';
import { useSettings } from '@/context/SettingsContext';
import { api } from '@/services/api';
import { ChatMessages } from '@/components/ai-message/chat/ChatMessages';
import { QuickActions } from '@/components/ai-message/chat/QuickActions';
import { ChatInput } from '@/components/ai-message/chat/ChatInput';
import styles from './page.module.css';
import { SpamCheckerAnalysis } from '@/components/ai-message/option/SpamCheckerAnalysis';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: '안녕하세요! 센드온 AI 메시지 도우미입니다. 어떤 메시지를 만들어 드릴까요? 😊',
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [spamCheckerData, setSpamCheckerData] = useState<SpamCheckerResult | null>(null);

  const streamingRef = useRef('');
  const { streamSSE } = useSSE();
  const { agentMode, modelId, spamCheckEnabled } = useSettings();

  const handleSend = useCallback(
    async (message: string) => {
      const userMsg: ChatMessage = { role: 'user', content: message };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);
      setStreamingContent('');
      streamingRef.current = '';
      setSpamCheckerData(null);

      await streamSSE(
        api.chatMessageUrl(),
        api.buildChatBody({
          message,
          conversationHistory: updatedMessages,
          agentMode,
          spamCheckEnabled,
          modelId,
        }),
        {
          onChunk: (event) => {
            if (event.type === 'text' && typeof event.data === 'string') {
              streamingRef.current += event.data;
              setStreamingContent(streamingRef.current);
            } else if (event.type === 'result' && typeof event.data === 'string' && event.agentName === 'spam_checker') {
              try {
                setSpamCheckerData(JSON.parse(event.data) as SpamCheckerResult);
              } catch {
                // Spam checker result parsing failure — non-critical
              }
            }
          },
          onComplete: () => {
            const finalContent = streamingRef.current;
            if (finalContent) {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: finalContent },
              ]);
            }
            setStreamingContent('');
            streamingRef.current = '';
            setIsStreaming(false);
          },
          onError: () => {
            setStreamingContent('');
            streamingRef.current = '';
            setIsStreaming(false);
          },
        },
      );
    },
    [messages, streamSSE, agentMode, spamCheckEnabled, modelId],
  );

  const handleQuickAction = useCallback(
    (text: string) => {
      if (!isStreaming) {
        handleSend(text);
      }
    },
    [isStreaming, handleSend],
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>💬 AI 메시지 대화형</h1>
        <p>AI와 대화하며 메시지를 만들어보세요.</p>
      </div>
      <div className={styles.chatWrap}>
        <ChatMessages
          messages={messages}
          streamingContent={streamingContent}
        />
        {spamCheckerData && (
          <div style={{ padding: '0 16px 16px' }}>
            <SpamCheckerAnalysis data={spamCheckerData} />
          </div>
        )}
        <div className={styles.inputArea}>
          <QuickActions onAction={handleQuickAction} />
          <ChatInput onSend={handleSend} isStreaming={isStreaming} />
        </div>
      </div>
    </div>
  );
}
