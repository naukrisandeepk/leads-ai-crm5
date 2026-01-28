import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Plus, 
  X,
  Send,
  Loader2,
  Inbox,
  LayoutList,
  Columns,
  History,
  Save,
  MessageSquare,
  Database,
  WifiOff
} from 'lucide-react';
import { Lead, CRMStatus, MessageSource } from './types';
import { analyzeMessage } from './services/geminiService';
import { fetchLeads, createLead, updateLeadStatus, addLeadNote, clearAllData } from './services/leadService';
import { isSupabaseConfigured } from './lib/supabase';
import LeadStats from './components/LeadStats';
import CRMTable from './components/CRMTable';
import PipelineBoard from './components/PipelineBoard';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  // Initialize leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [showSimulator, setShowSimulator] = useState(false);
  
  // Simulator State
  const [simMessage, setSimMessage] = useState('');
  const [simSource, setSimSource] = useState<MessageSource>(MessageSource.INSTAGRAM_DM);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Selected Lead State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');

  // Fetch leads from Supabase on load
  const loadLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      console.error(err);
      if (isSupabaseConfigured) {
        setError("Failed to load leads from database. Please check connection.");
      } else {
        // Should not happen with local fallback, but just in case
        setError("Failed to load local data.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleAnalyze = async () => {
    if (!simMessage.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const analysis = await analyzeMessage(simMessage, simSource);
      
      const newLead: Lead = {
        id: Date.now().toString(),
        username: `user_${Math.floor(Math.random() * 1000)}`,
        platform: simSource,
        message_text: simMessage,
        timestamp: new Date().toISOString(),
        crm_status: CRMStatus.NEW,
        tags: [],
        history: [{
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: 'system',
          content: `Lead captured via ${simSource}`
        }],
        analysis
      };

      // Save to DB (or Local)
      await createLead(newLead);
      
      // Update local state (optimistic update or re-fetch)
      await loadLeads(); // Re-fetch to ensure consistency
      
      setSimMessage('');
      setShowSimulator(false);
    } catch (error) {
      console.error("Analysis/Save failed", error);
      alert("Failed to save lead.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: CRMStatus) => {
    try {
      // Optimistic update
      const updatedLeads = leads.map(lead => 
        lead.id === leadId ? { ...lead, crm_status: newStatus } : lead
      );
      setLeads(updatedLeads);
      if (selectedLead) setSelectedLead({ ...selectedLead, crm_status: newStatus });

      // DB Update
      await updateLeadStatus(leadId, newStatus);
      
      // Background refresh to get history ID correct
      loadLeads();
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
      loadLeads(); // Revert on error
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;

    try {
      const noteContent = newNote;
      setNewNote(''); // Clear input immediately
      
      await addLeadNote(selectedLead.id, noteContent);
      await loadLeads(); // Refresh to show new note in history
      
      // Update selected lead view
      const updatedLead = await fetchLeads().then(ls => ls.find(l => l.id === selectedLead.id));
      if (updatedLead) setSelectedLead(updatedLead);
      
    } catch (e) {
      console.error(e);
      alert("Failed to save note");
    }
  };

  // Clear data handler
  const handleClearData = async () => {
    if(confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
      try {
        await clearAllData();
        setLeads([]);
        setSelectedLead(null);
      } catch (e) {
        alert("Failed to clear data");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Inbox size={18} />
            </div>
            LeadsAI
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <SettingsIcon size={20} />
              Settings
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">System Status</p>
            {isSupabaseConfigured ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Supabase Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-yellow-400" title="Running in local mode. Data is saved to browser storage only.">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                Local Demo Mode
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-green-400 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              AI Engine Online
            </div>
          </div>
          <button onClick={handleClearData} className="text-xs text-slate-500 hover:text-red-400 mt-4 underline w-full text-center">
            Delete All {isSupabaseConfigured ? 'Database' : 'Local'} Records
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4 md:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Inbox size={18} />
            </div>
            <span className="font-bold text-slate-800">LeadsAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm">
             Unified Lead Intelligence & CRM
             {!isSupabaseConfigured && (
               <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium ml-2">
                 Demo Mode
               </span>
             )}
          </div>

          <button 
            onClick={() => setShowSimulator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Simulate Message
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                <span className="block sm:inline">{error}</span>
                <span className="block text-xs mt-1">Make sure you have set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file</span>
              </div>
            )}
            
            {activeTab === 'dashboard' ? (
              <>
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
                    <p className="text-slate-500 text-sm">Overview of recent activity across all platforms.</p>
                  </div>

                  <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <LayoutList size={16} />
                      List
                    </button>
                    <button 
                      onClick={() => setViewMode('board')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'board' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Columns size={16} />
                      Pipeline
                    </button>
                  </div>
                </div>

                {isLoading && leads.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                  </div>
                ) : (
                  <>
                    <LeadStats leads={leads} />

                    <div className="mt-8">
                      {viewMode === 'list' ? (
                        <CRMTable 
                          leads={leads} 
                          onViewLead={(lead) => setSelectedLead(lead)} 
                        />
                      ) : (
                        <PipelineBoard 
                          leads={leads}
                          onViewLead={(lead) => setSelectedLead(lead)} 
                        />
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="mt-4">
                 <SettingsPanel 
                   onSave={(s) => { console.log(s); setActiveTab('dashboard'); }} 
                   onClose={() => setActiveTab('dashboard')} 
                 />
              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Simulate Incoming Message</h3>
              <button onClick={() => setShowSimulator(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Platform Source</label>
                <select 
                  value={simSource}
                  onChange={(e) => setSimSource(e.target.value as MessageSource)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={MessageSource.INSTAGRAM_DM}>Instagram DM</option>
                  <option value={MessageSource.INSTAGRAM_COMMENT}>Instagram Comment</option>
                  <option value={MessageSource.FACEBOOK_MSG}>Facebook Messenger</option>
                  <option value={MessageSource.LINKEDIN_MSG}>LinkedIn Message</option>
                  <option value={MessageSource.YOUTUBE_COMMENT}>YouTube Comment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message Content</label>
                <textarea 
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 h-32 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  placeholder="Type a message as if you were a customer..."
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800">
                  <strong>AI Analysis:</strong> Gemini will analyze buying intent and context specific to the selected platform (e.g., LinkedIn vs Instagram).
                </p>
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !simMessage.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Process Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail / Management Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-50 transition-all">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             
             {/* Modal Header */}
             <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-slate-800">@{selectedLead.username}</h2>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      {selectedLead.platform}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">Captured {new Date(selectedLead.timestamp).toLocaleDateString()}</span>
                </div>
                <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
               
               {/* Status Management */}
               <section>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Lead Status</label>
                 <div className="flex flex-wrap gap-2">
                    {Object.values(CRMStatus).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedLead.id, status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          selectedLead.crm_status === status
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                 </div>
               </section>

               {/* AI Intelligence */}
               <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white p-1.5 rounded shadow-sm">
                      <Loader2 size={16} className="text-indigo-600" /> 
                    </div>
                    <h4 className="font-bold text-slate-800">AI Intelligence</h4>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Intent</div>
                      <div className="font-semibold text-slate-800">{selectedLead.analysis.intent}</div>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Score</div>
                      <div className={`font-bold ${selectedLead.analysis.score > 70 ? 'text-green-600' : 'text-slate-700'}`}>
                        {selectedLead.analysis.score} / 100
                      </div>
                    </div>
                 </div>

                 <div className="bg-white p-3 rounded-lg border border-indigo-100/50">
                    <div className="text-xs text-indigo-600 font-bold uppercase mb-1">Recommended Action</div>
                    <p className="text-sm text-slate-800">{selectedLead.analysis.recommended_action}</p>
                 </div>
               </section>

               {/* Original Message */}
               <section>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Original Message</label>
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 italic relative">
                    <MessageSquare size={16} className="absolute top-4 right-4 text-slate-300" />
                   "{selectedLead.message_text}"
                 </div>
               </section>

               {/* History & Notes */}
               <section>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                    <History size={14} /> Activity History
                  </label>
                  
                  <div className="space-y-4 mb-4">
                    {selectedLead.history && selectedLead.history.length > 0 ? (
                      selectedLead.history.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="flex-col items-center flex">
                             <div className={`w-2 h-2 rounded-full mt-2 ${
                               item.type === 'status_change' ? 'bg-orange-400' : 
                               item.type === 'note' ? 'bg-indigo-400' : 'bg-slate-300'
                             }`} />
                             <div className="w-0.5 bg-slate-100 flex-1 h-full mt-1"></div>
                          </div>
                          <div className="pb-2">
                             <div className="text-xs text-slate-400">
                               {new Date(item.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="text-sm text-slate-700">{item.content}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-400 italic">No history available</div>
                    )}
                  </div>

                  <div className="flex gap-2 items-start mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a private note..."
                      className="bg-transparent border-none focus:ring-0 w-full text-sm resize-none h-16"
                    />
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Save size={16} />
                    </button>
                  </div>
               </section>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}