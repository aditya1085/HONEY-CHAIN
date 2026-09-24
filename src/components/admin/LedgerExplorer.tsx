import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LedgerBlock, LedgerHead } from '../../types';
import {
  verifyLedgerIntegrity,
  getChainModeBadge,
} from '../../services/blockchainService';
import {
  ShieldCheck,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronRight,
  Hash,
} from 'lucide-react';

export const LedgerExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Verification Audit State
  const [auditing, setAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<{
    isValid: boolean;
    totalBlocks: number;
    message: string;
    tamperedBlockIndex?: number;
  } | null>(null);

  const chainBadge = getChainModeBadge();

  useEffect(() => {
    const q = query(collection(db, 'ledgerRecords'), orderBy('index', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as LedgerBlock);
        setBlocks(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Ledger listener query error:', err);
        const fallbackQ = collection(db, 'ledgerRecords');
        onSnapshot(fallbackQ, (snap) => {
          const list = snap.docs.map((d) => d.data() as LedgerBlock);
          list.sort((a, b) => b.index - a.index);
          setBlocks(list);
          setLoading(false);
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRunAudit = async () => {
    setAuditing(true);
    setAuditResult(null);
    try {
      const res = await verifyLedgerIntegrity();
      setAuditResult(res);
    } catch (err) {
      console.error('Audit failed:', err);
      setAuditResult({
        isValid: false,
        totalBlocks: 0,
        message: `Audit failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setAuditing(false);
    }
  };

  const filteredBlocks = blocks.filter(
    (b) =>
      b.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.currentHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.index).includes(searchQuery)
  );

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'HIVE_REGISTERED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'BATCH_CREATED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'BATCH_VERIFIED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'LAB_REPORT_HASHED':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
      case 'PACKAGING_COMPLETED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Chain Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
              Cryptographic Ledger & Blockchain Explorer
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold border ${chainBadge.badgeColor}`}
            >
              {chainBadge.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {chainBadge.description} Permanent, immutable provenance ledger for honey traceability.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={auditing}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${auditing ? 'animate-spin' : ''}`} />
          <span>{auditing ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}</span>
        </button>
      </div>

      {/* Audit Result Banner */}
      {auditResult && (
        <div
          className={`rounded-2xl border p-4 ${
            auditResult.isValid
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {auditResult.isValid ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm">
                {auditResult.isValid
                  ? `Chain Integrity: 100% Cryptographically Valid (${auditResult.totalBlocks} Blocks Verified)`
                  : 'Chain Integrity: Validation Failed! Tampering Detected'}
              </div>
              <p className="text-xs mt-0.5 opacity-90">{auditResult.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by Block #, Event Type, Entity ID or SHA-256..."
          className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
      </div>

      {/* Live Blocks Stream */}
      {loading ? (
        <div className="p-8 text-center text-sm text-zinc-400">Loading ledger records...</div>
      ) : filteredBlocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <ShieldCheck className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No Blocks Recorded Yet
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Blocks will automatically be minted upon Hive registration, Batch creation, IoT verification, and Lab certification.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBlocks.map((block) => {
            const isExpanded = expandedIndex === block.index;
            return (
              <div
                key={block.index}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 hover:border-amber-300 transition-colors"
              >
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : block.index)}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 font-mono text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      #{block.index}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getEventBadge(
                        block.eventType
                      )}`}
                    >
                      {block.eventType.replace('_', ' ')}
                    </span>

                    <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {block.entityId}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{new Date(block.timestamp).toLocaleString()}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Hashes Ribbon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="truncate rounded-lg bg-zinc-50 p-2 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-400 mr-1">Prev:</span>
                    {block.previousHash}
                  </div>
                  <div className="truncate rounded-lg bg-amber-50/60 p-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 mr-1">Hash:</span>
                    {block.currentHash}
                  </div>
                </div>

                {/* Expanded Payload Details */}
                {isExpanded && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Block Payload & Metadata
                    </div>
                    <pre className="rounded-xl bg-zinc-950 p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                      {JSON.stringify(
                        {
                          index: block.index,
                          eventType: block.eventType,
                          entityId: block.entityId,
                          dataHash: block.dataHash,
                          previousHash: block.previousHash,
                          currentHash: block.currentHash,
                          timestamp: block.timestamp,
                          metadata: block.metadata,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
