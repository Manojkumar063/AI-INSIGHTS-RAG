import { motion } from 'motion/react';
import { BrainCircuit, Upload, MessageSquare, Shield, CheckCircle2, FileText, Search } from 'lucide-react';
import { User } from 'firebase/auth';

interface WelcomeProps {
  user: User;
}

export function Welcome({ user }: WelcomeProps) {
  const steps = [
    { icon: Upload, title: "Upload PDF", desc: "Drag and drop or select any PDF document from your machine." },
    { icon: MessageSquare, title: "Chat Naturally", desc: "Ask questions, request summaries, or extract specific data points." },
    { icon: Shield, title: "Secure Insights", desc: "Your data stays private and is only accessible to you." },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-12"
    >
      {/* Hero */}
      <div className="space-y-6">
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200"
        >
          <BrainCircuit className="w-10 h-10 text-white" />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 italic">
            Welcome back, <span className="text-indigo-600">{user.displayName?.split(' ')[0]}</span>
          </h1>
          <p className="text-lg text-stone-500 font-medium">
            Your personal AI intelligence hub is ready. Start by uploading a document in the sidebar.
          </p>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-6 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center text-center space-y-4 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100 text-indigo-600">
              <step.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">{step.title}</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed mt-2">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Badge */}
      <div className="pt-10 flex items-center gap-6 border-t border-stone-100 w-full justify-center opacity-60">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          GDPR Compliant
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          End-to-End Encryption
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Gemini 3.1 Pro Powered
        </div>
      </div>
    </motion.div>
  );
}
