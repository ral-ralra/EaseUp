import { styles } from "../styles/theme.js";

export function CenterModal({ title, message, children, actions }) {
  return (
    <div style={styles.overlay} role="dialog" aria-modal="true">
      <div style={styles.centerCard}>
        <h2 style={styles.centerTitle}>{title}</h2>
        {message ? <p style={styles.centerMessage}>{message}</p> : null}
        {children}
        <div style={styles.actionRow}>{actions}</div>
      </div>
    </div>
  );
}
