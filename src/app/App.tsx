import styles from './App.module.css'

/**
 * Phase 0 application shell.
 * Non-interactive SVG workspace placeholder — no pan/zoom/selection yet.
 */
export default function App() {
  return (
    <div className={styles.shell}>
      <header className={styles.chrome}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.name}>Axenloom</h1>
          <p className={styles.tagline}>Shape ideas without boundaries.</p>
        </div>
        <p className={styles.status}>Phase 0 · foundation</p>
      </header>

      <main className={styles.workspace} aria-label="Canvas workspace">
        <svg
          className={styles.canvas}
          role="img"
          aria-label="Infinite canvas placeholder. Editing interactions arrive in later phases."
        >
          <defs>
            <pattern
              id="axenloom-dot-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle
                className={styles.gridPattern}
                cx="1"
                cy="1"
                r="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="var(--workspace-bg)" />
          <rect width="100%" height="100%" fill="url(#axenloom-dot-grid)" />
          <text
            className={styles.hint}
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            Workspace ready — interactions begin in Phase 1
          </text>
        </svg>
      </main>
    </div>
  )
}
