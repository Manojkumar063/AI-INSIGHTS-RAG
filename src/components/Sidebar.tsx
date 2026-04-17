import { useState, useRef, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FileText, Plus, LogOut, Loader2, Trash2, Database, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

interface SidebarProps {
  userId: string;
  selectedDocId: string | null;
  onSelectDoc: (id: string | null) => void;
  onLogout: () => void;
  user: User;
}

export function Sidebar({ userId, selectedDocId, onSelectDoc, onLogout, user }: SidebarProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const path = "documents";
    const q = query(
      collection(db, path),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocuments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) throw new Error("Failed to extract text");

      const { text } = await resp.json();

      const docPath = "documents";
      try {
        const docRef = await addDoc(collection(db, docPath), {
          name: file.name,
          content: text,
          userId: userId,
          size: file.size,
          type: file.type,
          createdAt: serverTimestamp(),
        });
        onSelectDoc(docRef.id);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Error uploading document. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    const docPath = `documents/${id}`;
    try {
      await deleteDoc(doc(db, "documents", id));
      if (selectedDocId === id) onSelectDoc(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  };

  return (
    <div className="w-80 h-full flex flex-col bg-[#F5F5F0] border-r border-stone-200">
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">InsightAI</h1>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-4 px-6 bg-white border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          ) : (
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
          )}
          <span className="text-sm font-semibold text-stone-600">
            {isUploading ? 'Extracting text...' : 'Upload Document'}
          </span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
        </button>

        {/* Categories / Sections */}
        <div className="mt-10 flex-1 overflow-y-auto no-scrollbar space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Documents</h2>
              <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {documents.length}
              </span>
            </div>
            
            <div className="space-y-1">
              {documents.length === 0 ? (
                <div className="px-4 py-8 text-center bg-stone-100/50 rounded-2xl border border-stone-200/50">
                  <Database className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-400 font-medium">No documents yet</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98]",
                      selectedDocId === doc.id
                        ? "bg-stone-900 text-white shadow-xl shadow-stone-200"
                        : "hover:bg-white hover:shadow-md text-stone-600"
                    )}
                  >
                    <FileText className={cn("w-5 h-5", selectedDocId === doc.id ? "text-indigo-400" : "text-stone-400")} />
                    <span className="flex-1 text-sm font-medium truncate">{doc.name}</span>
                    <button
                      onClick={(e) => handleDelete(e, doc.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all",
                        selectedDocId === doc.id 
                          ? "hover:bg-stone-800 text-stone-400 hover:text-red-400" 
                          : "hover:bg-stone-100 text-stone-400 hover:text-red-500"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Profile / Logout */}
        <div className="mt-auto pt-6 border-t border-stone-200">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-10 h-10 rounded-xl border-2 border-white shadow-sm"
              alt="Profile"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{user.displayName}</p>
              <p className="text-[10px] font-medium text-stone-400 truncate uppercase tracking-wider">Enterprise User</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-white hover:shadow-md rounded-xl text-stone-400 hover:text-stone-900 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
