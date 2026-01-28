import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Lead, LeadCategory } from '../types';
import { Users, AlertCircle, CheckCircle, Flame } from 'lucide-react';

interface LeadStatsProps {
  leads: Lead[];
}

const LeadStats: React.FC<LeadStatsProps> = ({ leads }) => {
  const total = leads.length;
  const hotLeads = leads.filter(l => l.analysis.category === LeadCategory.HOT).length;
  const warmLeads = leads.filter(l => l.analysis.category === LeadCategory.WARM).length;
  const conversionRate = total > 0 ? ((hotLeads / total) * 100).toFixed(1) : '0';

  const categoryData = [
    { name: 'Hot', value: hotLeads, color: '#ef4444' }, // Red-500
    { name: 'Warm', value: warmLeads, color: '#eab308' }, // Yellow-500
    { name: 'Cold/Noise', value: leads.length - hotLeads - warmLeads, color: '#94a3b8' }, // Slate-400
  ];

  const intentData = [
    { name: 'Explicit', value: leads.filter(l => l.analysis.intent === 'Explicit').length },
    { name: 'Implicit', value: leads.filter(l => l.analysis.intent === 'Implicit').length },
    { name: 'Future', value: leads.filter(l => l.analysis.intent === 'Future').length },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Metric Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Messages</p>
            <h3 className="text-2xl font-bold text-slate-800">{total}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Users size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Hot Leads</p>
            <h3 className="text-2xl font-bold text-slate-800">{hotLeads}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <Flame size={24} />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">Ready to buy</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Attention Needed</p>
            <h3 className="text-2xl font-bold text-slate-800">{warmLeads}</h3>
          </div>
          <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
            <AlertCircle size={24} />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">Requires nurturing</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Hot Lead %</p>
            <h3 className="text-2xl font-bold text-slate-800">{conversionRate}%</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">Of total traffic</p>
      </div>

      {/* Charts Row */}
      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
        <h4 className="text-lg font-semibold text-slate-700 mb-4">Lead Classification Distribution</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
            <Tooltip cursor={{fill: 'transparent'}} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
        <h4 className="text-lg font-semibold text-slate-700 mb-4">Buying Intent Breakdown</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={intentData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {intentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#d946ef', '#cbd5e1'][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeadStats;