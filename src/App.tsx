import { useState } from 'react';
import { FirebaseProvider, useAuth } from './components/FirebaseContext';
import { signInWithGoogle, auth } from './lib/firebase';
import { Calendar, Users, LayoutDashboard, LogOut, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Inventory from './components/Inventory';
import MyTeams from './components/MyTeams';
import Opponents from './components/Opponents';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'teams' | 'opponents'>('inventory');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5F5] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Ticket className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-sans tracking-tight">FieldSlot</h1>
          <p className="text-slate-500 mb-8 font-sans">Book fields, find opponents, and lead your team to victory.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-3"
          >
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-slate-900 font-sans text-sm sm:text-base">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-slate-900" />
            <span className="font-bold text-xl tracking-tight">FieldSlot</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full" />
              <span className="font-medium hidden sm:inline">{user.displayName}</span>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/50 p-1 rounded-2xl w-fit">
          {[
            { id: 'inventory', label: 'Book Field', icon: Calendar },
            { id: 'opponents', label: 'Find Opponents', icon: Users },
            { id: 'teams', label: 'My Teams', icon: LayoutDashboard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'opponents' && <Opponents />}
            {activeTab === 'teams' && <MyTeams />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
