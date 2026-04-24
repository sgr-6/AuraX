import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { currentPage } = useStore();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A2E',
            color: '#E8E8F0',
            border: '1px solid #252540',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '13px',
            borderRadius: '12px'
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#0A0A0A' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#0A0A0A' } }
        }}
      />

      <AnimatePresence mode="wait">
        {currentPage === 'landing' ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LandingPage />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen">
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
