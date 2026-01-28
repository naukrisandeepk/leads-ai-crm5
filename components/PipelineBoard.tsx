import React from 'react';
import { Lead, CRMStatus, LeadCategory, MessageSource } from '../types';
import { MoreHorizontal, Instagram, Facebook, Linkedin, Youtube, Flame } from 'lucide-react';

interface PipelineBoardProps {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
}

const PipelineBoard: React.FC<PipelineBoardProps> = ({ leads, onViewLead }) => {
  const columns = [
    { id: CRMStatus.NEW, title: 'New Leads', color: 'border-blue-400' },
    { id: CRMStatus.CONTACTED, title: 'Contacted', color: 'border-yellow-400' },
    { id: CRMStatus.QUALIFIED, title: 'Qualified', color: 'border-purple-400' },
    { id: CRMStatus.CONVERTED, title: 'Converted', color: 'border-green-400' },
  ];

  const getPlatformIcon = (source: MessageSource) => {
    switch(source) {
      case MessageSource.INSTAGRAM_DM: return <Instagram size={14} className="text-pink-600" />;
      case MessageSource.FACEBOOK_MSG: return <Facebook size={14} className="text-blue-600" />;
      case MessageSource.LINKEDIN_MSG: return <Linkedin size={14} className="text-blue-700" />;
      case MessageSource.YOUTUBE_COMMENT: return <Youtube size={14} className="text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
      {columns.map((col) => {
        const colLeads = leads.filter(l => l.crm_status === col.id);
        
        return (
          <div key={col.id} className="min-w-[300px] w-[300px] bg-slate-50 rounded-xl flex flex-col border border-slate-200 max-h-full">
            <div className={`p-4 border-t-4 ${col.color} bg-white rounded-t-xl border-b border-slate-100 flex justify-between items-center`}>
              <h3 className="font-bold text-slate-700">{col.title}</h3>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                {colLeads.length}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {colLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  onClick={() => onViewLead(lead)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-800 text-sm">@{lead.username}</div>
                      {getPlatformIcon(lead.platform)}
                    </div>
                    {lead.analysis.category === LeadCategory.HOT && (
                      <Flame size={14} className="text-red-500" fill="currentColor" />
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {lead.message_text}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {lead.analysis.product_detected || 'Unknown Interest'}
                    </span>
                    <div className={`text-xs font-bold ${
                      lead.analysis.score > 70 ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {lead.analysis.score} pts
                    </div>
                  </div>
                </div>
              ))}
              
              {colLeads.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  No leads in this stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineBoard;