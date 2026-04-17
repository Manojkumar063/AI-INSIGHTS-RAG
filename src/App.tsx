import { useEffect, useState } from 'react';
import { auth, googleProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { FileText, MessageSquare, LogOut, Upload, Search, Shield, BrainCircuit, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { Welcome } from './components/Welcome';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <BrainCircuit className="w-12 h-12 text-indigo-600 animate-pulse" />
          <p className="text-stone-500 font-medium animate-pulse">Initializing InsightAI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-stone-200"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <BrainCircuit className="w-12 h-12 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-stone-900">InsightAI</h1>
              <p className="text-stone-500">
                Unlock insights from your documents with your personal AI Knowledge Assistant.
              </p>
            </div>
            
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-stone-800 transition-all active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </button>
            
            <div className="flex items-center gap-2 text-stone-400 text-xs uppercase tracking-widest font-semibold pt-4">
              <Shield className="w-3 h-3" />
              Secure Enterprise Access
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F0] overflow-hidden font-sans">
      <Sidebar 
        userId={user.uid} 
        selectedDocId={selectedDocId} 
        onSelectDoc={setSelectedDocId} 
        onLogout={handleLogout}
        user={user}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white ml-0 md:ml-0 rounded-l-[40px] shadow-2xl border-l border-stone-200">
        <AnimatePresence mode="wait">
          {selectedDocId ? (
            <ChatInterface 
              key={selectedDocId}
              docId={selectedDocId} 
              userId={user.uid} 
            />
          ) : (
            <Welcome user={user} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

