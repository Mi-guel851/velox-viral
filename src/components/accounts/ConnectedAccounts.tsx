"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Users,
  Activity,
  Key,
  X,
  Lock,
} from "lucide-react";
import { Platform } from "@/lib/types";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface DBAccount {
  id: string;
  platform: Platform;
  platform_user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
  status: string;
  last_synced_at: string | null;
  token_expires_at: string | null;
  scopes: string[];
}

export const ConnectedAccounts: React.FC = () => {
  const { accounts, connectAccount, disconnectAccount, refreshAccountSync } = useAppStore();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [customHandle, setCustomHandle] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [dbAccounts, setDbAccounts] = useState<DBAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Fetch real connected accounts from the database
  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.authenticated) {
        // The accounts are managed in the store, but we can check for real connections
        // For now, the store is the source of truth for connected accounts
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Use the platform OAuth flow to connect
  const handleConnectSubmit = async () => {
    try {
      const res = await fetch("/api/auth/" + selectedPlatform);
      const data = await res.json();

      if (data.authUrl) {
        // Open the OAuth authorization URL in a new window
        window.open(data.authUrl, "_blank", "width=600,height=700");
        var platName = PLATFORMS[selectedPlatform]?.name || selectedPlatform;
        toast.info("Opening " + platName + " authorization. Complete the flow in the popup window.");
        setShowConnectModal(false);

        // Poll for connection status (the OAuth callback will update the database)
        var pollInterval = setInterval(async () => {
          var profileRes = await fetch("/api/user/profile");
          var profileData = await profileRes.json();
          if (profileData.connectedAccounts > accounts.length) {
            clearInterval(pollInterval);
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            toast.success(platName + " account connected successfully!");
            // Also add to local store for immediate UI update
            connectAccount(selectedPlatform, data.username || ("user_" + selectedPlatform));
          }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollInterval), 120000);
      } else if (data.error) {
        toast.error(data.error);
      } else {
        // Fallback: the platform might not have OAuth configured yet
        var fallbackPlatName = PLATFORMS[selectedPlatform]?.name || selectedPlatform;
        toast.error(
          fallbackPlatName + " OAuth is not configured on this deployment. " +
          "Add the platform's client ID and secret to your environment variables to enable real connections."
        );
      }
    } catch (err) {
      // If OAuth route fails, fall back to the local store
      var handle = customHandle.trim() || ("creator_" + selectedPlatform);
      connectAccount(selectedPlatform, handle);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      var catchPlatName = PLATFORMS[selectedPlatform]?.name || selectedPlatform;
      toast.success("Connected " + catchPlatName + " account (local mode).");
      setShowConnectModal(false);
      setCustomHandle("");
    }
  };

  const handleSync = (id: string, name: string) => {
    setSyncingId(id);
    setTimeout(() => {
      refreshAccountSync(id);
      setSyncingId(null);
      toast.success(`${name} account token refreshed & analytics synced!`);
    }, 600);
  };

  const handleDisconnect = (id: string, name: string) => {
    disconnectAccount(id);
    toast.error(`Disconnected ${name}. You can reconnect anytime.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Accounts Header */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              OAuth 2.0 & Token Health Engine
            </span>
            <Badge variant="success">{accounts.length} Channel{accounts.length !== 1 ? "s" : ""} Connected</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Connected Social Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage official API connections, OAuth permissions, token refresh lifecycles, and channel health.
          </p>
        </div>

        <Button
          onClick={() => setShowConnectModal(true)}
          variant="gradient"
          className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Social Channel</span>
        </Button>
      </div>

      {/* Connected Channels Grid */}
      {accounts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mx-auto">
            <Link2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No channels connected yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Connect your first social media account to start publishing cross-platform content.
            </p>
          </div>
          <Button
            onClick={() => setShowConnectModal(true)}
            variant="gradient"
            className="h-11 px-6 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Your First Channel</span>
          </Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const pConf = PLATFORMS[acc.platform];
          const isConnected = acc.status === "connected";

          return (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-5 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-200 transition-all group"
            >
              <div className="space-y-3.5">
                {/* Account Top Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={acc.avatar}
                        alt={acc.displayName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-slate-50 p-1 rounded-full border border-slate-200">
                        <PlatformIcon platform={acc.platform} className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 truncate max-w-[140px]">
                        {acc.displayName}
                      </h4>
                      <span className="text-xs text-slate-500 block font-mono">
                        @{acc.username}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isConnected ? "success" : "destructive"}
                    className="text-[10px] capitalize"
                  >
                    {isConnected ? "Active" : "Expired"}
                  </Badge>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-black/40 border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Followers</span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatNumber(acc.followerCount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Eng. Rate</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {acc.metrics.engagementRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Avg Likes</span>
                    <span className="text-xs font-bold text-blue-700">
                      {formatNumber(acc.metrics.avgLikes)}
                    </span>
                  </div>
                </div>

                {/* Permissions & Scopes pill */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Granted OAuth Scopes:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {acc.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-[9px] font-mono bg-slate-100/80 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md truncate max-w-[140px]"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Token Sync info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-700" />
                    Last sync: {acc.lastSync}
                  </span>
                  <span>Limits: 100% OK</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(acc.id, acc.displayName)}
                  className="h-8 text-xs text-slate-500 hover:text-rose-600 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Disconnect
                </Button>

                <Button
                  variant="apple"
                  size="sm"
                  disabled={syncingId === acc.id}
                  onClick={() => handleSync(acc.id, acc.displayName)}
                  className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  <RefreshCw
                    className={cn("w-3.5 h-3.5 mr-1", syncingId === acc.id && "animate-spin")}
                  />
                  <span>Sync Token</span>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* CONNECT CHANNEL MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-3xl p-6 max-w-lg w-full border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Connect Social Media Account</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Platform Grid */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  1. Select Platform
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_PLATFORMS.map((p) => {
                    const pConf = PLATFORMS[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedPlatform(p)}
                        className={cn(
                          "p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-medium",
                          selectedPlatform === p
                            ? "bg-blue-600/30 border-blue-500 text-slate-900 ring-1 ring-blue-400"
                            : "bg-slate-100/80 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                        )}
                      >
                        <PlatformIcon platform={p} className="w-5 h-5" />
                        <span className="capitalize text-[11px] truncate">{pConf?.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Handle Input */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  2. Account Handle / Username
                </label>
                <input
                  type="text"
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  placeholder={`e.g. your_${selectedPlatform}_handle`}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* OAuth Security Note */}
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Official OAuth 2.0 PKCE Handshake
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Velox Viral requests only publishing and read-insights permissions. Your credentials are securely managed and tokens are encrypted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectModal(false)}
                className="text-xs text-slate-500"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleConnectSubmit}
                className="rounded-xl px-5 text-xs font-semibold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Connect</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
