"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, Check, Copy, Eye, EyeOff, RotateCcw } from "lucide-react";

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSaveToken: (newToken: string) => void;
  defaultToken: string;
}

export function TokenModal({
  isOpen,
  onClose,
  token,
  onSaveToken,
  defaultToken,
}: TokenModalProps) {
  const [inputVal, setInputVal] = useState(token);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveToken(inputVal.trim());
    onClose();
  };

  const handleReset = () => {
    setInputVal(defaultToken);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Apify API Token Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely authenticate requests to the Apify platform API
            </p>
          </div>
        </div>

        {/* Security Warning from Apify prompt */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-200">
              Security notice: Don&apos;t share your token with untrusted parties
            </p>
            <p className="text-amber-300/80 leading-relaxed">
              Your API token grants programmatic access to run actors, inspect datasets, and modify key-value stores. Token values are stored locally in your browser session.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Active Apify Token
            </label>
            <div className="relative flex items-center">
              <input
                type={showSecret ? "text" : "password"}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="apify_api_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 pr-20"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showSecret ? "Hide token" : "Show token"}
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Copy token"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800/50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to active token
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                Apply Token
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
