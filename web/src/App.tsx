import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { UserAuthProvider } from './contexts/UserAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { lazy, Suspense } from 'react';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ParentalControls from './pages/ParentalControls';
import PaymentHandler from './components/PaymentHandler';
import PaymentSelector from './components/PaymentSelector';
import ChildLogin from './components/ChildLogin';
import LoginForm from './components/LoginForm';
import Savings from './pages/Savings';
import Achievements from './components/Achievements';

const ChildrenPage = lazy(() => import('./pages/ChildrenPage'));
const AddChildPage = lazy(() => import('./pages/AddChildPage'));

const queryClient = new QueryClient();

const PaymentHandlerWrapper: React.FC = () => {
  const { type, childId } = useParams<{ type: string; childId?: string }>();
  console.log('PaymentHandler route:', { type, childId });
  return (
    <PaymentHandler
      onBack={() => window.history.back()}
      type={type as 'lightning' | 'mpesa'}
      childId={childId}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <UserAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense
              fallback={<div className='container mx-auto p-4'>Loading...</div>}
            >
              <Routes>
                <Route path='/' element={<Index />} />
                <Route
                  path='/login'
                  element={
                    <LoginForm
                      onChildLogin={() =>
                        (window.location.href = '/child-login')
                      }
                    />
                  }
                />
                <Route
                  path='/child-login'
                  element={
                    <ChildLogin
                      onBack={() => (window.location.href = '/login')}
                    />
                  }
                />
                <Route
                  path='/parental-controls'
                  element={<ParentalControls />}
                />
                <Route path='/children' element={<ChildrenPage />} />
                <Route
                  path='/payment/:type/:childId?'
                  element={<PaymentHandlerWrapper />}
                />
                <Route
                  path='/payment/:select/:childId?'
                  element={<PaymentSelector />}
                />
                <Route path='/achievements' element={<Achievements />} />


                <Route path='/add-child' element={<AddChildPage />} />
                <Route path='/savings' element={<Savings />} />
                <Route path='*' element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </UserAuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
