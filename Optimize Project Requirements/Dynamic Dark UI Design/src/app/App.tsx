import { useState } from 'react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage } from './pages/OrdersPage';
import { StockRequestsPage } from './pages/StockRequestsPage';
import { SLAMonitorPage } from './pages/SLAMonitorPage';
import { BillingPage } from './pages/BillingPage';

type UserRole = 'operations' | 'client' | 'finance';

interface User {
  name: string;
  role: UserRole;
  email: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('overview');

  const handleLogin = (email: string, password: string) => {
    let user: User;

    if (email.includes('ops')) {
      user = { name: 'Alex Morgan', role: 'operations', email };
    } else if (email.includes('client')) {
      user = { name: 'Sarah Chen', role: 'client', email };
    } else {
      user = { name: 'Michael Roberts', role: 'finance', email };
    }

    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentPage('overview');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('overview');
  };

  if (!isLoggedIn) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <LoginPage onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage userRole={currentUser!.role} />;
      case 'inventory':
        return <InventoryPage />;
      case 'orders':
        return <OrdersPage />;
      case 'stock-requests':
        return <StockRequestsPage userRole={currentUser!.role} />;
      case 'sla-monitor':
        return <SLAMonitorPage />;
      case 'billing':
        return <BillingPage />;
      default:
        return <OverviewPage userRole={currentUser!.role} />;
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 h-screen overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          userRole={currentUser!.role}
          userName={currentUser!.name}
          onLogout={handleLogout}
        />
        <div className="h-screen overflow-y-auto">
          <Header userName={currentUser!.name} notifications={3} />
          <main className="ml-64 p-8">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}