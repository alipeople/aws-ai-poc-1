'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './Sidebar.module.css';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  children?: { label: string; href: string; icon: string }[];
}

const AI_STUDIO_MENU: MenuItem[] = [
  {
    id: 'message',
    label: 'AI 메시지',
    icon: '✉️',
    children: [
      { label: '옵션형 (단계별)', href: '/ai-studio/message/option', icon: '🎯' },
      { label: '대화형 (AI 챗)', href: '/ai-studio/message/chat', icon: '💬' },
    ],
  },
  {
    id: 'template',
    label: 'AI 템플릿',
    icon: '📋',
    children: [
      { label: '템플릿 디자인', href: '/ai-studio/template/design', icon: '🎨' },
      { label: '심사 도우미', href: '/ai-studio/template/review', icon: '✅' },
    ],
  },
  {
    id: 'insight',
    label: 'AI 인사이트',
    icon: '📊',
    children: [
      { label: '성과 분석', href: '/ai-studio/insight/analysis', icon: '📈' },
      { label: '발송 최적화', href: '/ai-studio/insight/optimize', icon: '⚡' },
      { label: '타겟 추천', href: '/ai-studio/insight/target', icon: '🎯' },
    ],
  },
  {
    id: 'image',
    label: 'AI 이미지',
    icon: '🖼️',
    children: [
      { label: '이미지 개선', href: '/ai-studio/image/enhance', icon: '✨' },
      { label: '마케팅 이미지 생성', href: '/ai-studio/image/generate', icon: '🎨' },
      { label: 'A/B 변형', href: '/ai-studio/image/ab', icon: '🔀' },
    ],
  },
  {
    id: 'automation',
    label: 'AI 자동화',
    icon: '⚙️',
    children: [
      { label: '스마트 재발송', href: '/ai-studio/automation/resend', icon: '🔄' },
      { label: '정기발송 최적화', href: '/ai-studio/automation/schedule', icon: '📅' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['message']);

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: MenuItem) =>
    item.children?.some(c => pathname.startsWith(c.href)) ?? false;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>✨</span>
        <span className={styles.logoText}>AI 스튜디오</span>
      </div>
      <nav className={styles.nav}>
        <div className={styles.sectionLabel}>AI 스튜디오</div>
        {AI_STUDIO_MENU.map(item => (
          <div key={item.id} className={styles.menuItem}>
            <button
              className={`${styles.menuBtn} ${isParentActive(item) ? styles.menuBtnActive : ''}`}
              onClick={() => toggleItem(item.id)}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              <span className={styles.menuLabel}>{item.label}</span>
              <span className={`${styles.arrow} ${expandedItems.includes(item.id) ? styles.arrowOpen : ''}`}>
                ›
              </span>
            </button>
            {expandedItems.includes(item.id) && item.children && (
              <div className={styles.submenu}>
                {item.children.map(child => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`${styles.submenuItem} ${isActive(child.href) ? styles.submenuItemActive : ''}`}
                  >
                    <span className={styles.submenuIcon}>{child.icon}</span>
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.credits}>
          <span className={styles.creditsIcon}>⚡</span>
          <span>AI 크레딧: <strong>1,000</strong></span>
        </div>
      </div>
    </aside>
  );
}
