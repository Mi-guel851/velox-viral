"use client";

import React, { useState } from "react";
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
import { Platform, SocialAccount } from "@/lib/types";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export const ConnectedAccounts: React.FC = () => {
  const { accounts, connectAccount, disconnectAccount, refreshAccountSync } = useAppStore();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [customHandle, setCustomHandle] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);

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

  const handleConnectSubmit = () => {
    const handle = customHandle.trim() || `creator_${selectedPlatform}`;
    connectAccount(selectedPlatform, handle);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    toast.success(`Successfully connected ${PLATFORMS[selectedPlatform]?.name} account!`);
    setShowConnectModal(false);
    setCustomHandle("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Accounts Header */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              OAuth 2.0 & Token Health Engine
            </span>
            <Badge variant="success">7 Platforms Ready</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Connected Social Accounts
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const pConf = PLATFORMS[acc.platform];
          const isConnected = acc.status === "connected";

          return (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
            >
              <div className="space-y-3.5">
                {/* Account Top Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={acc.avatar}
                        alt={acc.displayName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-zinc-950 p-1 rounded-full border border-white/20">
                        <PlatformIcon platform={acc.platform} className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white truncate max-w-[140px]">
                        {acc.displayName}
                      </h4>
                      <span className="text-xs text-zinc-400 block font-mono">
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
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-black/40 border border-white/5 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Followers</span>
                    <span className="text-xs font-bold text-white">
                      {formatNumber(acc.followerCount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Eng. Rate</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {acc.metrics.engagementRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Avg Likes</span>
                    <span className="text-xs font-bold text-indigo-300">
                      {formatNumber(acc.metrics.avgLikes)}
                    </span>
                  </div>
                </div>

                {/* Permissions & Scopes pill */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Granted OAuth Scopes:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {acc.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-[9px] font-mono bg-white/[0.04] border border-white/5 text-zinc-400 px-1.5 py-0.5 rounded-md truncate max-w-[140px]"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Token Sync info */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    Last sync: {acc.lastSync}
                  </span>
                  <span>Limits: 100% OK</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(acc.id, acc.displayName)}
                  className="h-8 text-xs text-zinc-500 hover:text-rose-400 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Disconnect
                </Button>

                <Button
                  variant="apple"
                  size="sm"
                  disabled={syncingId === acc.id}
                  onClick={() => handleSync(acc.id, acc.displayName)}
                  className="h-8 px-3 text-xs text-zinc-300 hover:text-white rounded-xl"
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

      {/* CONNECT CHANNEL MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-3xl p-6 max-w-lg w-full border border-white/15 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Connect Social Media Account</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Platform Grid */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
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
                            ? "bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-400"
                            : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.05]"
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
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  2. Account Handle / Username
                </label>
                <input
                  type="text"
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  placeholder={`E.g. alexcreator_${selectedPlatform}`}
                  className="w-full rounded-xl bg-zinc-950 border border-white/10 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* OAuth Security Note */}
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Official OAuth 2.0 PKCE Handshake
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  ViralFlow requests only publishing and read-insights permissions. Your credentials are securely managed and tokens are encrypted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectModal(false)}
                className="text-xs text-zinc-400"
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
