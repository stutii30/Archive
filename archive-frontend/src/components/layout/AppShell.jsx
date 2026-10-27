import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import styles from './AppShell.module.css'

/**
 * AppShell — root layout: fixed Sidebar (236px) + scrollable main content.
 * Matches Design.md §9.1 layout spec.
 */
export default function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
