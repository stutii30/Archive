import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

// Lazy-loaded pages for optimal bundle splitting
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))
const LibraryPage = lazy(() => import('./pages/LibraryPage.jsx'))
const ResourceDetailPage = lazy(() => import('./pages/ResourceDetailPage.jsx'))
const CommunityPage = lazy(() => import('./pages/CommunityPage.jsx'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage.jsx'))
const EventsPage = lazy(() => import('./pages/EventsPage.jsx'))
const BookmarksPage = lazy(() => import('./pages/BookmarksPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'))
const AdminModerationPage = lazy(() => import('./pages/AdminModerationPage.jsx'))

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--ink-soft)' }}>
    <p>Loading view...</p>
  </div>
)

const withSuspense = (Component) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
)

// ── Router ─────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Auth pages (outside AppShell) ──────────────────────────────────────────
  {
    path: '/auth/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/auth/register',
    element: withSuspense(RegisterPage),
  },

  // ── Protected app routes (inside AppShell) ────────────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/library" replace /> },
      { path: 'library',           element: withSuspense(LibraryPage) },
      { path: 'library/:id',       element: withSuspense(ResourceDetailPage) },
      { path: 'community',         element: withSuspense(CommunityPage) },
      { path: 'community/:postId', element: withSuspense(PostDetailPage) },
      { path: 'events',            element: withSuspense(EventsPage) },
      { path: 'events/:id',        element: withSuspense(EventsPage) },
      { path: 'bookmarks',         element: withSuspense(BookmarksPage) },
      { path: 'search',            element: withSuspense(SearchResultsPage) },
      { path: 'profile',           element: withSuspense(ProfilePage) },
      { path: 'profile/:userId',   element: withSuspense(ProfilePage) },
      { path: 'admin/moderation',  element: withSuspense(AdminModerationPage) },
    ],
  },
])
