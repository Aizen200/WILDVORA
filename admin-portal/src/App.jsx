import { useState } from 'react'
import { Sidebar, Topbar } from './components/shared.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ListingsApprovalQueue from './pages/ListingsApprovalQueue.jsx'
import BookingsDisputes from './pages/BookingsDisputes.jsx'

function ComingSoon({ title }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f5f1ea' }}>
      <div className="text-center">
        <div className="text-4xl mb-3">🚧</div>
        <div className="text-gray-400 text-sm font-medium">{title} — coming soon</div>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')

  const pageTitles = {
    dashboard: 'Dashboard',
    listings:  'Listings Approval Queue',
    bookings:  'Bookings & Disputes',
    hosts:     'Host Management',
    customers: 'Customer Management',
    payouts:   'Payouts Control',
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'listings':  return <ListingsApprovalQueue />
      case 'bookings':  return <BookingsDisputes />
      default:          return <ComingSoon title={pageTitles[page]} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={page} onNav={setPage} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar page={page} />
        {renderPage()}
      </div>
    </div>
  )
}