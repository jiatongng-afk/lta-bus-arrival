import React, { useState } from 'react';
import { LtaApiConfig } from '../types/bus';
import { X, Key, Server, Copy, Check, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

interface ApiConfigModalProps {
  config: LtaApiConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: LtaApiConfig) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
}) => {
  const [accountKey, setAccountKey] = useState(config.accountKey || '');
  const [proxyUrl, setProxyUrl] = useState(config.proxyUrl || '');
  const [useLiveData, setUseLiveData] = useState(config.useLiveData || false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      accountKey: accountKey.trim(),
      proxyUrl: proxyUrl.trim(),
      useLiveData,
      autoRefreshIntervalSeconds: config.autoRefreshIntervalSeconds || 20,
    });
    onClose();
  };

  const sampleBackendSnippet = `// Sample Express.js proxy route for your backend server:
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const LTA_ACCOUNT_KEY = process.env.LTA_DATAMALL_KEY || '${accountKey || 'YOUR_LTA_KEY'}';

// Proxy BusArrival endpoint to bypass browser CORS:
app.get('/api/lta/BusArrivalv2', async (req, res) => {
  const { BusStopCode } = req.query;
  try {
    const response = await fetch(
      \`https://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=\${BusStopCode}\`,
      {
        headers: {
          'AccountKey': LTA_ACCOUNT_KEY,
          'accept': 'application/json'
        }
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('LTA Transit Proxy running on port 3001'));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleBackendSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-modal-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 id="api-modal-title" className="text-lg font-bold text-slate-900">
                LTA DataMall API &amp; Backend Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Configure real-time Singapore Land Transport Authority credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Mode Selector */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Cpu className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">
                    High-Fidelity Singapore Transit Simulation (Active)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Pre-loaded with real Singapore bus stops, services (190, 61, 65, 14, 960, etc.), crowd indicators, and live GPS movements. Perfect for frontend development before your backend is deployed.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={useLiveData}
                  onChange={(e) => setUseLiveData(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* AccountKey input */}
          <div className="space-y-2">
            <label className="flex items-center justify-between font-semibold text-slate-800 text-xs">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>LTA DataMall AccountKey</span>
              </span>
              <a
                href="https://datamall.lta.gov.sg/content/datamall/en/request-api.html"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Request Free API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              placeholder="e.g. gH8zF3kL9mQ2... (LTA DataMall Key)"
              value={accountKey}
              onChange={(e) => setAccountKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-800 bg-white"
            />
            <p className="text-[11px] text-slate-500">
              Your key is stored strictly in your browser&apos;s localStorage and is used for requests.
            </p>
          </div>

          {/* Backend Proxy URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Backend Proxy Endpoint (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. http://localhost:3001/api/lta or /api/lta"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-800 bg-white"
            />
            <p className="text-[11px] text-slate-500">
              Note: LTA&apos;s DataMall API endpoints do not enable browser CORS directly; proxying through your backend allows seamless communication.
            </p>
          </div>

          {/* Ready-to-use Backend Express Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-700">
                Backend Connection Code (Express.js)
              </span>
              <button
                onClick={copyToClipboard}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl overflow-x-auto text-[11px] font-mono text-emerald-300/90 leading-relaxed max-h-44">
              <pre>{sampleBackendSnippet}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
