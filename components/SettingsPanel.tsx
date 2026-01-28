import React, { useState, useEffect } from 'react';
import { AppSettings, PlatformConfig } from '../types';
import { Check, Shield, Server, RefreshCw, Instagram, Facebook, Linkedin, Youtube, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getSupabaseDebugInfo } from '../lib/supabase';

interface SettingsPanelProps {
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  initialSettings?: AppSettings;
}

const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  enabled: false,
  appId: '',
  appSecret: '',
  accessToken: '',
  webhookToken: '',
  pageId: '',
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSave, onClose }) => {
  // Initialize to 'database' if we are debugging, otherwise 'instagram'
  const [activeTab, setActiveTab] = useState<string>('database');
  
  const [settings, setSettings] = useState<AppSettings>({
    instagram: { ...DEFAULT_PLATFORM_CONFIG, enabled: true },
    facebook: { ...DEFAULT_PLATFORM_CONFIG },
    linkedin: { ...DEFAULT_PLATFORM_CONFIG },
    youtube: { ...DEFAULT_PLATFORM_CONFIG },
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [dbInfo, setDbInfo] = useState<any>(null);

  useEffect(() => {
    setDbInfo(getSupabaseDebugInfo());
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only handle config changes for platform tabs
    if (activeTab === 'database') return;
    
    setSettings({
      ...settings,
      [activeTab as keyof AppSettings]: {
        ...settings[activeTab as keyof AppSettings],
        [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
      }
    });
  };

  const handleTestConnection = () => {
    setTestStatus('testing');
    setTimeout(() => {
      // Simulate validation
      if (activeTab !== 'database' && settings[activeTab as keyof AppSettings].accessToken.length > 5) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
      }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  const tabs = [
    { id: 'database', label: 'Database Status', icon: <Database size={18} /> },
    { id: 'instagram', label: 'Instagram', icon: <Instagram size={18} /> },
    { id: 'facebook', label: 'Facebook', icon: <Facebook size={18} /> },
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={18} /> },
    { id: 'youtube', label: 'YouTube', icon: <Youtube size={18} /> },
  ];

  const renderDatabasePanel = () => {
    if (!dbInfo) return null;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Connection Status</h3>
          <p className="text-sm text-slate-500">Diagnostics for Supabase connection.</p>
        </div>

        <div className={`p-4 rounded-lg border flex items-start gap-3 ${dbInfo.usingLocalMode ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          {dbInfo.usingLocalMode ? <AlertTriangle className="text-yellow-600 flex-shrink-0" /> : <CheckCircle className="text-green-600 flex-shrink-0" />}
          <div>
            <h4 className={`font-bold ${dbInfo.usingLocalMode ? 'text-yellow-800' : 'text-green-800'}`}>
              {dbInfo.usingLocalMode ? 'Running in Local Demo Mode' : 'Connected to Supabase'}
            </h4>
            <p className="text-sm text-slate-700 mt-1">
              {dbInfo.usingLocalMode 
                ? "The application is using browser local storage because valid Supabase credentials were not found." 
                : "The application is successfully configured to talk to your Supabase project."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">VITE_SUPABASE_URL</span>
              {dbInfo.urlConfigured ? 
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><Check size={12}/> Present</span> : 
                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><XCircle size={12}/> Missing</span>
              }
            </div>
            <div className="bg-slate-100 p-2 rounded text-xs font-mono text-slate-600 break-all">
              {dbInfo.urlPreview}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Must be set in .env file or Vercel Environment Variables.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">VITE_SUPABASE_ANON_KEY</span>
              {dbInfo.keyConfigured ? 
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><Check size={12}/> Present</span> : 
                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><XCircle size={12}/> Missing</span>
              }
            </div>
            <div className="bg-slate-100 p-2 rounded text-xs font-mono text-slate-600 break-all">
              {dbInfo.keyPreview}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col md:flex-row overflow-hidden max-w-5xl mx-auto h-[600px]">
      
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-6 px-2 flex items-center gap-2">
          <Server size={20} className="text-indigo-600"/>
          Integrations
        </h2>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setTestStatus('idle');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id !== 'database' && settings[tab.id as keyof AppSettings].enabled && (
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'database' ? renderDatabasePanel() : (
          <form onSubmit={handleSubmit} className="max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 capitalize">{activeTab} Configuration</h3>
                <p className="text-sm text-slate-500">Manage API credentials and webhook settings.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="enabled" 
                  checked={settings[activeTab as keyof AppSettings].enabled} 
                  onChange={handleConfigChange}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm font-medium text-slate-700">Enable Integration</span>
              </label>
            </div>

            <div className={`space-y-6 ${!settings[activeTab as keyof AppSettings].enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">App / Client ID</label>
                  <input 
                    type="text" 
                    name="appId" 
                    value={settings[activeTab as keyof AppSettings].appId} 
                    onChange={handleConfigChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">App Secret</label>
                  <input 
                    type="password" 
                    name="appSecret" 
                    value={settings[activeTab as keyof AppSettings].appSecret} 
                    onChange={handleConfigChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Access Token</label>
                <input 
                  type="text" 
                  name="accessToken" 
                  value={settings[activeTab as keyof AppSettings].accessToken} 
                  onChange={handleConfigChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
                  placeholder="EAAB..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Webhook Verify Token</label>
                  <input 
                    type="text" 
                    name="webhookToken" 
                    value={settings[activeTab as keyof AppSettings].webhookToken} 
                    onChange={handleConfigChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="custom_token_123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {activeTab === 'youtube' ? 'Channel ID' : 'Page / Account ID'}
                  </label>
                  <input 
                    type="text" 
                    name="pageId" 
                    value={settings[activeTab as keyof AppSettings].pageId} 
                    onChange={handleConfigChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder={activeTab === 'youtube' ? 'UC_...' : '10052...'}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <Shield size={18} className="text-slate-500"/>
                      <span className="text-sm text-slate-600 font-medium">Connection:</span>
                      <span className={`text-sm font-bold ${
                          testStatus === 'success' ? 'text-green-600' : 
                          testStatus === 'failed' ? 'text-red-600' : 'text-slate-400'
                      }`}>
                          {testStatus === 'idle' ? 'Not Tested' : testStatus.toUpperCase()}
                      </span>
                  </div>
                  <button 
                      type="button" 
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing' || !settings[activeTab as keyof AppSettings].enabled}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                      {testStatus === 'testing' && <RefreshCw className="animate-spin" size={14} />}
                      Test API
                  </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Check size={18} />
                Save All Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;