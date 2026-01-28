import React from 'react';
import { Lead, LeadCategory, CRMStatus, Urgency, MessageSource } from '../types';
import { Eye, Download, ArrowUpRight, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';

interface CRMTableProps {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
}

const CRMTable: React.FC<CRMTableProps> = ({ leads, onViewLead }) => {

  const handleExport = () => {
    const headers = ['ID', 'Platform', 'Username', 'Category', 'Intent', 'Product', 'Urgency', 'Score', 'Status', 'Date'];
    const rows = leads.map(l => [
      l.id,
      l.platform,
      l.username,
      l.analysis.category,
      l.analysis.intent,
      l.analysis.product_detected,
      l.analysis.urgency,
      l.analysis.score,
      l.crm_status,
      new Date(l.timestamp).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlatformIcon = (source: MessageSource) => {
    switch(source) {
      case MessageSource.INSTAGRAM_DM:
      case MessageSource.INSTAGRAM_COMMENT:
        return <Instagram size={16} className="text-pink-600" />;
      case MessageSource.FACEBOOK_MSG:
        return <Facebook size={16} className="text-blue-600" />;
      case MessageSource.LINKEDIN_MSG:
        return <Linkedin size={16} className="text-blue-700" />;
      case MessageSource.YOUTUBE_COMMENT:
        return <Youtube size={16} className="text-red-600" />;
      default:
        return <div className="w-4 h-4 bg-slate-400 rounded-full" />;
    }
  };

  const getCategoryBadge = (cat: LeadCategory) => {
    switch (cat) {
      case LeadCategory.HOT: return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">HOT</span>;
      case LeadCategory.WARM: return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">WARM</span>;
      default: return <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-semibold">NO LEAD</span>;
    }
  };

  const getUrgencyIcon = (urgency: Urgency) => {
     switch(urgency) {
       case Urgency.HIGH: return <ArrowUpRight className="text-red-500" size={16} />;
       case Urgency.MEDIUM: return <ArrowUpRight className="text-yellow-500 rotate-45" size={16} />;
       default: return <span className="text-slate-400">-</span>;
     }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">All Leads</h3>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold w-16 text-center">Source</th>
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Analysis</th>
              <th className="p-4 font-semibold">Intent / Product</th>
              <th className="p-4 font-semibold text-center">Score</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
               <tr>
                 <td colSpan={7} className="p-8 text-center text-slate-400">No leads processed yet.</td>
               </tr>
            ) : leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4 text-center">
                  <div className="flex justify-center" title={lead.platform}>
                    {getPlatformIcon(lead.platform)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-900">@{lead.username}</div>
                  <div className="text-xs text-slate-500">{new Date(lead.timestamp).toLocaleDateString()}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryBadge(lead.analysis.category)}
                    <div className="flex items-center gap-1 text-xs text-slate-500 ml-2">
                      Urgency: {getUrgencyIcon(lead.analysis.urgency)}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 truncate max-w-xs opacity-75" title={lead.message_text}>
                    "{lead.message_text}"
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-800">{lead.analysis.product_detected}</div>
                  <div className="text-xs text-slate-500 capitalize">{lead.analysis.intent} Intent</div>
                </td>
                <td className="p-4 text-center">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    lead.analysis.score > 70 ? 'bg-green-100 text-green-700' : 
                    lead.analysis.score > 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {lead.analysis.score}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded border capitalize ${
                    lead.crm_status === CRMStatus.NEW ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    lead.crm_status === CRMStatus.CONVERTED ? 'bg-green-50 border-green-200 text-green-700' :
                    'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    {lead.crm_status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => onViewLead(lead)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CRMTable;