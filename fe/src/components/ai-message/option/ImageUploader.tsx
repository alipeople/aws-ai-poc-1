'use client';

import React, { useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import styles from './ImageUploader.module.css';
import headerStyles from './StepHeader.module.css';

const MAX_IMAGES = 3;

export interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) return;

      const toProcess = Array.from(files).slice(0, remaining);
      let processed = 0;
      const results: string[] = [];

      toProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          results.push(reader.result as string);
          processed++;
          if (processed === toProcess.length) {
            onChange([...images, ...results]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [images, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange],
  );

  return (
    <Card>
      <div className={headerStyles.header}>🖼️ MMS 이미지</div>
      <div className={styles.label}>최대 {MAX_IMAGES}장 · JPG, PNG, GIF</div>
      <div className={styles.grid}>
        {images.map((src, i) => (
          <div key={i} className={styles.thumb}>
            <img src={src} alt={`MMS 이미지 ${i + 1}`} className={styles.thumbImg} />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => handleRemove(i)}
              aria-label={`이미지 ${i + 1} 삭제`}
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => inputRef.current?.click()}
          >
            +
            <span className={styles.addBtnLabel}>추가</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        multiple
        className={styles.hiddenInput}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </Card>
  );
}
