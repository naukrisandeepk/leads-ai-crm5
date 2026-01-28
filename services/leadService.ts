import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lead, CRMStatus, HistoryItem } from '../types';

// Local Storage Keys
const LOCAL_LEADS_KEY = 'leads_ai_leads';
const LOCAL_HISTORY_KEY = 'leads_ai_history';

// Helper for local storage
const getLocalData = () => {
  try {
    const l = localStorage.getItem(LOCAL_LEADS_KEY);
    const h = localStorage.getItem(LOCAL_HISTORY_KEY);
    return {
      leads: l ? JSON.parse(l) : [],
      history: h ? JSON.parse(h) : []
    };
  } catch (e) {
    return { leads: [], history: [] };
  }
};

const saveLocalData = (leads: any[], history: any[]) => {
  localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
};

// Fetch all leads with their history
export const fetchLeads = async (): Promise<Lead[]> => {
  if (!isSupabaseConfigured) {
    // Local Mode
    const { leads, history } = getLocalData();
    // Simulate join and sort
    return leads.map((lead: any) => ({
      ...lead,
      history: history
        .filter((h: any) => h.lead_id === lead.id)
        .sort((a: HistoryItem, b: HistoryItem) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Supabase Mode
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      history (*)
    `)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  // Sort history for each lead (newest first)
  return data.map((lead: any) => ({
    ...lead,
    history: lead.history.sort((a: HistoryItem, b: HistoryItem) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }));
};

// Create a new lead and its initial history entry
export const createLead = async (lead: Lead): Promise<void> => {
  if (!isSupabaseConfigured) {
    // Local Mode
    const { leads, history } = getLocalData();
    leads.push({
      ...lead,
      history: undefined // Don't store nested history in the flat leads list
    });
    
    // Store history items separately
    if (lead.history.length > 0) {
      lead.history.forEach(h => {
        history.push({
          ...h,
          lead_id: lead.id
        });
      });
    }
    saveLocalData(leads, history);
    return;
  }

  // Supabase Mode
  // 1. Insert Lead
  const { error: leadError } = await supabase
    .from('leads')
    .insert({
      id: lead.id,
      username: lead.username,
      platform: lead.platform,
      message_text: lead.message_text,
      timestamp: lead.timestamp,
      crm_status: lead.crm_status,
      tags: lead.tags,
      analysis: lead.analysis
    });

  if (leadError) throw leadError;

  // 2. Insert Initial History
  if (lead.history.length > 0) {
    const historyItems = lead.history.map(h => ({
      id: h.id,
      lead_id: lead.id,
      date: h.date,
      type: h.type,
      content: h.content,
      author: h.author
    }));

    const { error: historyError } = await supabase
      .from('history')
      .insert(historyItems);

    if (historyError) throw historyError;
  }
};

// Update status and add a history record
export const updateLeadStatus = async (leadId: string, newStatus: CRMStatus): Promise<void> => {
  if (!isSupabaseConfigured) {
    // Local Mode
    const { leads, history } = getLocalData();
    const leadIndex = leads.findIndex((l: any) => l.id === leadId);
    if (leadIndex !== -1) {
      leads[leadIndex].crm_status = newStatus;
      history.push({
        id: Date.now().toString(),
        lead_id: leadId,
        date: new Date().toISOString(),
        type: 'status_change',
        content: `Status updated to ${newStatus}`
      });
      saveLocalData(leads, history);
    }
    return;
  }

  // Supabase Mode
  // Update Status
  const { error: updateError } = await supabase
    .from('leads')
    .update({ crm_status: newStatus })
    .eq('id', leadId);

  if (updateError) throw updateError;

  // Add History Record
  const { error: historyError } = await supabase
    .from('history')
    .insert({
      id: Date.now().toString(),
      lead_id: leadId,
      date: new Date().toISOString(),
      type: 'status_change',
      content: `Status updated to ${newStatus}`
    });

  if (historyError) throw historyError;
};

// Add a note to a lead
export const addLeadNote = async (leadId: string, content: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    // Local Mode
    const { leads, history } = getLocalData();
    history.push({
      id: Date.now().toString(),
      lead_id: leadId,
      date: new Date().toISOString(),
      type: 'note',
      content: content
    });
    saveLocalData(leads, history);
    return;
  }

  // Supabase Mode
  const { error } = await supabase
    .from('history')
    .insert({
      id: Date.now().toString(),
      lead_id: leadId,
      date: new Date().toISOString(),
      type: 'note',
      content: content
    });

  if (error) throw error;
};

// Clear all data (For the reset button)
export const clearAllData = async (): Promise<void> => {
  if (!isSupabaseConfigured) {
    localStorage.removeItem(LOCAL_LEADS_KEY);
    localStorage.removeItem(LOCAL_HISTORY_KEY);
    return;
  }

  // Supabase Mode
  const { error: hError } = await supabase.from('history').delete().neq('id', '0');
  if (hError) throw hError;
  
  const { error: lError } = await supabase.from('leads').delete().neq('id', '0');
  if (lError) throw lError;
};