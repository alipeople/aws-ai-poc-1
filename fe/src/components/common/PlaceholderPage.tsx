import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  icon: string;
  title: string;
  description: string;
}

export default function PlaceholderPage({ icon, title, description }: PlaceholderPageProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>{icon}</div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <span className={styles.badge}>준비 중</span>
    </div>
  );
}
