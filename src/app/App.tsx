import CanvasWorkspace from '../canvas/CanvasWorkspace'
import styles from './App.module.css'

/**
 * Application shell. Phase 3: viewport, nodes, selection, drag, and resize.
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
        <p className={styles.status}>Phase 3 · resize</p>
      </header>

      <main className={styles.workspace} aria-label="Canvas workspace">
        <CanvasWorkspace />
      </main>
    </div>
  )
}
