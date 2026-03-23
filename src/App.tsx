import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { useDarkMode } from '@/shared/hooks/useDarkMode'
import { AdminLayout } from '@/shared/components/layout/AdminLayout'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { CompanyDetailPage } from '@/pages/CompanyDetailPage'
import { TrackerUsersPage } from '@/pages/TrackerUsersPage'
import { PlanningUsersPage } from '@/pages/PlanningUsersPage'
import { DemoRequestsPage } from '@/pages/DemoRequestsPage'
import { TrialManagementPage } from '@/pages/TrialManagementPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { WebsiteUsersPage } from '@/pages/WebsiteUsersPage'
import { SubscriptionDashboardPage } from '@/pages/SubscriptionDashboardPage'
import { EmailBroadcastPage } from '@/pages/EmailBroadcastPage'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const initDarkMode = useDarkMode((s) => s.init)

  useEffect(() => {
    initDarkMode()
    const unsubscribe = init()
    return unsubscribe
  }, [init, initDarkMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          {/* LoadMind Tracker */}
          <Route path="tracker/companies" element={<CompaniesPage />} />
          <Route path="tracker/companies/:id" element={<CompanyDetailPage />} />
          <Route path="tracker/users" element={<TrackerUsersPage />} />
          <Route path="tracker/subscriptions" element={
            <SubscriptionDashboardPage
              product="tracker"
              title="Tracker Subscriptions"
              planColors={{ demo: '#94a3b8', starter: '#3b82f6', growth: '#8b5cf6', business: '#f97316', enterprise: '#ef4444' }}
              plans={['demo', 'starter', 'growth', 'business', 'enterprise']}
            />
          } />
          {/* 3D Load Planning */}
          <Route path="planning/users" element={<PlanningUsersPage />} />
          <Route path="planning/trial" element={<TrialManagementPage />} />
          <Route path="planning/subscriptions" element={
            <SubscriptionDashboardPage
              product="3d-planning"
              title="3D Planning Subscriptions"
              planColors={{ free: '#94a3b8', starter: '#3b82f6', pro: '#8b5cf6', enterprise: '#ef4444' }}
              plans={['free', 'starter', 'pro', 'enterprise']}
            />
          } />
          {/* Website */}
          <Route path="website/users" element={<WebsiteUsersPage />} />
          {/* Shared */}
          <Route path="demo-requests" element={<DemoRequestsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="broadcasts" element={<EmailBroadcastPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
