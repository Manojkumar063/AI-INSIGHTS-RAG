import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Send, Loader2, BrainCircuit, User, Sparkles, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askGeminiStream } from '../services/gemini';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

interface ChatInterfaceProps {
  docId: string;
  userId: string;
}

export function ChatInterface({ docId, userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [document, setDocument] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      const docPath = `documents/${docId}`;
      try {
        const d = await getDoc(doc(db, "documents", docId));
        if (d.exists()) setDocument(d.data());
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, docPath);
      }
    };
    fetchDoc();

    const messagesPath = `documents/${docId}/messages`;
    const q = query(
      collection(db, "documents", docId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath);
    });

    return () => unsubscribe();
  }, [docId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamingContent]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping || !document) return;

    const userText = inputText.trim();
    setInputText("");
    setIsTyping(true);
    setStreamingContent("");

    const messagesPath = `documents/${docId}/messages`;
    try {
      // Add user message to Firestore
      await addDoc(collection(db, "documents", docId, "messages"), {
        text: userText,
        role: "user",
        createdAt: serverTimestamp(),
      });

      // Prepare history
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      // Call Gemini with streaming
      const finalResponse = await askGeminiStream(
        userText, 
        document.content, 
        history,
        (content) => setStreamingContent(content)
      );

      // Add AI response to Firestore
      await addDoc(collection(db, "documents", docId, "messages"), {
        text: finalResponse,
        role: "assistant",
        createdAt: serverTimestamp(),
      });

      setStreamingContent("");
    } catch (error) {
       if (error instanceof Error && error.message.includes('authInfo')) {
         return;
       }
       console.error("Chat Error:", error);
       alert("Something went wrong. Please try again.");
    } finally {
      setIsTyping(false);
      setStreamingContent("");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <header className="px-8 py-5 border-bottom border-stone-100 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-orange-50 rounded-2xl shadow-sm border border-orange-100">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 leading-tight truncate max-w-[200px] md:max-w-md">
              {document?.name || 'Loading document...'}
            </h2>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Context Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="p-2.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all">
             <Download className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scroll-smooth"
      >
        {messages.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
            <div className="p-6 bg-indigo-50 rounded-full">
              <Sparkles className="w-12 h-12 text-indigo-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-stone-900">Start the conversation</h3>
              <p className="text-sm text-stone-500 font-medium leading-relaxed">
                Ask anything about "{document?.name}". I can summarize, find specific details, or explain complex parts.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-start gap-4 group",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border transition-shadow group-hover:shadow-md",
                msg.role === 'user' 
                  ? "bg-stone-900 border-stone-800" 
                  : "bg-indigo-50 border-indigo-100"
              )}>
                {msg.role === 'user' 
                  ? <User className="w-5 h-5 text-stone-100" /> 
                  : <BrainCircuit className="w-5 h-5 text-indigo-600" />
                }
              </div>
              
              <div className={cn(
                "max-w-[85%] px-6 py-4 rounded-3xl shadow-sm text-sm leading-relaxed",
                msg.role === 'user'
                  ? "bg-stone-100 text-stone-900 rounded-tr-none"
                  : "bg-white border border-stone-100 text-stone-700 rounded-tl-none font-medium"
              )}>
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-indigo-600 shadow-sm" />
            </div>
            <div className={cn(
              "px-6 py-4 bg-white border border-stone-100 rounded-3xl rounded-tl-none shadow-sm flex flex-col gap-3",
              !streamingContent && "animate-pulse"
            )}>
              {streamingContent ? (
                <div className="markdown-body text-sm font-medium text-stone-700">
                  <Markdown>{streamingContent}</Markdown>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                        className="w-2 h-2 bg-indigo-200 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">InsightAI Thinking...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-8 shrink-0 bg-white border-t border-stone-100">
        <form 
          onSubmit={handleSend}
          className="max-w-4xl mx-auto flex items-center gap-3 bg-stone-100 p-2 rounded-[28px] focus-within:bg-stone-200 transition-colors border border-transparent focus-within:border-stone-300"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask a question about ${document?.name || 'the document'}...`}
            className="flex-1 bg-transparent px-6 py-3 text-sm font-medium outline-none placeholder:text-stone-400 text-stone-900"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 active:scale-95 shrink-0"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-[10px] text-center mt-3 text-stone-400 font-bold uppercase tracking-widest">
          AI may provide information that is subject to verification.
        </p>
      </div>
    </motion.div>
  );
}
