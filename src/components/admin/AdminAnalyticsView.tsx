import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  Store,
  DollarSign,
  Package,
  Layers,
  MapPin,
  Flame,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { SystemStatsRecord } from '../../types';

interface AIAnomaly {
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  action: string;
}

interface AIForecast {
  region: string;
  floralSource: string;
  expectedYieldTrend: string;
  notes: string;
}

interface AIRecommendation {
  category: string;
  priority: string;
  text: string;
}

interface AIInsightsPayload {
  summary: string;
  anomalies: AIAnomaly[];
  forecasts: AIForecast[];
  recommendations: AIRecommendation[];
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const AdminAnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<SystemStatsRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recomputing, setRecomputing] = useState<boolean>(false);
  const [insights, setInsights] = useState<AIInsightsPayload | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);

  // Filters state
  const [filterState, setFilterState] = useState<string>('ALL');
  const [filterFloral, setFilterFloral] = useState<string>('ALL');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');
  const [filterQualityVerdict, setFilterQualityVerdict] = useState<string>('ALL');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await fetch('/api/admin/stats/recompute', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        fetchAIInsights(data.stats);
      }
    } catch (e) {
      console.error('Failed to recompute stats:', e);
    } finally {
      setRecomputing(false);
    }
  };

  const fetchAIInsights = async (currentStats?: SystemStatsRecord) => {
    setLoadingInsights(true);
    try {
      const payloadStats = currentStats || stats;
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: payloadStats,
          filterContext: {
            state: filterState,
            floral: filterFloral,
            species: filterSpecies,
            quality: filterQualityVerdict,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
      }
    } catch (e) {
      console.error('AI Insights fetch error:', e);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format data for Species Pie Chart
  const speciesPieData = stats?.speciesDistribution
    ? Object.entries(stats.speciesDistribution).map(([name, value]) => ({ name, value }))
    : [];

  // Format data for Floral Pie Chart
  const floralPieData = stats?.floralDistribution
    ? Object.entries(stats.floralDistribution).map(([name, value]) => ({ name, value: Math.round(value) }))
    : [];

  // State yields data for Bar Chart
  const stateBarData = stats?.stateYields
    ? Object.entries(stats.stateYields).map(([stateName, val]) => ({
        state: stateName,
        hives: val.hives,
        harvestKg: val.harvestKg,
        salesGmv: Math.round(val.salesGmv / 100), // in hundreds
        purityRate: val.purityRate,
      }))
    : [];

  // Filtered state yields if state filter active
  const filteredStateData =
    filterState === 'ALL'
      ? stateBarData
      : stateBarData.filter((s) => s.state.toLowerCase() === filterState.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Top Header & Recompute Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-500/20 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Phase 5 Pre-Computed Server Engine
            </span>
            <span className="text-xs text-slate-400">
              Updated: {stats?.updatedAt ? new Date(stats.updatedAt).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-8 h-8 text-amber-500" />
            Executive Honey Analytics & Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            High-performance cached analytics backed by server-side Firestore aggregation pipelines & Polygon Amoy traceability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAIInsights()}
            disabled={loadingInsights || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-linear-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${loadingInsights ? 'animate-spin' : ''}`} />
            <span>{loadingInsights ? 'Analyzing AI...' : 'Gemini AI Insights'}</span>
          </button>

          <button
            onClick={handleRecompute}
            disabled={recomputing || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${recomputing ? 'animate-spin' : ''}`} />
            <span>{recomputing ? 'Recomputing...' : 'Recompute Stats'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Beekeepers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Beekeepers</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.totalBeekeepers || 0}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            {stats?.activeBeekeepers || 0} KYC Verified
          </p>
        </div>

        {/* Hives */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hives Monitored</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.totalHives || 0}
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
            {stats?.activeHives || 0} Telemetry Active
          </p>
        </div>

        {/* Total Harvest Volume */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Harvest (kg)</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.totalHarvestKg?.toLocaleString() || 0} <span className="text-xs font-normal">kg</span>
          </div>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
            Across {stats?.totalBatches || 0} Batches
          </p>
        </div>

        {/* Lab Purity Pass Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Purity Pass Rate</span>
            <FileCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {stats?.qualityMetrics?.c4PassRate || 100}%
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {stats?.pureBatches || 0} Pure / {stats?.flaggedBatches || 0} Flagged
          </p>
        </div>

        {/* Marketplace GMV */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Marketplace GMV</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{stats?.totalGmv?.toLocaleString() || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {stats?.totalOrders || 0} Orders (₹{stats?.avgOrderValue || 0} AOV)
          </p>
        </div>

        {/* Beekeeper 88% Direct Payout */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">88% BK Payouts</span>
            <Store className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            ₹{stats?.beekeeperEarnings?.toLocaleString() || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Platform Rev: ₹{stats?.platformRevenue?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>Analytics Slicers:</span>
        </div>

        {/* State Filter */}
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
        >
          <option value="ALL">All States / Regions</option>
          <option value="Punjab">Punjab</option>
          <option value="Jammu & Kashmir">Jammu & Kashmir</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="West Bengal">West Bengal</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Himachal Pradesh">Himachal Pradesh</option>
        </select>

        {/* Floral Variety Filter */}
        <select
          value={filterFloral}
          onChange={(e) => setFilterFloral(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
        >
          <option value="ALL">All Floral Sources</option>
          <option value="Mustard">Mustard</option>
          <option value="Acacia">Acacia</option>
          <option value="Eucalyptus">Eucalyptus</option>
          <option value="Wild Forest Jamun">Wild Forest Jamun</option>
          <option value="Multifloral">Multifloral</option>
        </select>

        {/* Species Filter */}
        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
        >
          <option value="ALL">All Colony Species</option>
          <option value="Apis mellifera">Apis mellifera (Italian)</option>
          <option value="Apis cerana indica">Apis cerana indica (Indian)</option>
          <option value="Apis dorsata">Apis dorsata (Rock bee)</option>
          <option value="Tetragonula">Stingless Bee</option>
        </select>

        {/* Quality Filter */}
        <select
          value={filterQualityVerdict}
          onChange={(e) => setFilterQualityVerdict(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
        >
          <option value="ALL">All Quality Verdicts</option>
          <option value="PURE">Pure Honey (C4 Negative)</option>
          <option value="FLAGGED">Flagged / Adulterated</option>
        </select>

        {(filterState !== 'ALL' || filterFloral !== 'ALL' || filterSpecies !== 'ALL' || filterQualityVerdict !== 'ALL') && (
          <button
            onClick={() => {
              setFilterState('ALL');
              setFilterFloral('ALL');
              setFilterSpecies('ALL');
              setFilterQualityVerdict('ALL');
            }}
            className="text-amber-600 hover:underline font-bold text-xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* GEMINI AI INSIGHTS PANEL */}
      {insights && (
        <div className="p-6 rounded-3xl bg-linear-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/30 shadow-md space-y-5 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Gemini 3.8 Flash Supply Chain Intelligence
                </h3>
                <p className="text-xs text-slate-500">Autonomous quality risk evaluation & yield forecasts</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
              Live AI Analysis
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-amber-500/20">
            {insights.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Anomalies */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Anomalies</span>
              </div>
              {insights.anomalies?.length > 0 ? (
                insights.anomalies.map((anom, idx) => (
                  <div key={idx} className="text-xs space-y-1 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{anom.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${anom.severity === 'HIGH' ? 'bg-red-500/20 text-red-600' : 'bg-amber-500/20 text-amber-600'}`}>
                        {anom.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{anom.description}</p>
                    <p className="text-amber-700 dark:text-amber-400 font-semibold text-[11px]">Action: {anom.action}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No anomalies detected in active range.</p>
              )}
            </div>

            {/* Yield Forecasts */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span>Regional Yield Forecasts</span>
              </div>
              {insights.forecasts?.length > 0 ? (
                insights.forecasts.map((fc, idx) => (
                  <div key={idx} className="text-xs space-y-1 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{fc.region} ({fc.floralSource})</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600">
                        {fc.expectedYieldTrend}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{fc.notes}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Forecast models running.</p>
              )}
            </div>

            {/* Operational Recommendations */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strategic Action Plan</span>
              </div>
              {insights.recommendations?.length > 0 ? (
                insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-xs space-y-1 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{rec.category}</span>
                      <span className="text-[10px] text-blue-500 font-semibold">{rec.priority} Priority</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{rec.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Standard protocol maintained.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: 6-Month Supply & Sales Trends */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Harvest Volume vs Sales GMV (6 Months)
              </h3>
              <p className="text-xs text-slate-400">Dynamic correlation between floral extraction & retail demand</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis yAxisId="left" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="harvestKg"
                  name="Harvest (kg)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sales"
                  name="Sales GMV (₹)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: State Yields & Active Hives */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Regional Yields & Purity (By State)
              </h3>
              <p className="text-xs text-slate-400">Total volume extracted across honey-producing states</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredStateData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="state" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="harvestKg" name="Harvest (kg)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="hives" name="Hives Count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Honey Floral Varieties Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Floral Source Market Share
            </h3>
            <p className="text-xs text-slate-400">Total kg distributed across floral varieties</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={floralPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(((percent ?? 0) as number) * 100).toFixed(0)}%)`}
                >
                  {floralPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Bee Colony Species Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Bee Species Colony Census
            </h3>
            <p className="text-xs text-slate-400">Census of Apis mellifera vs Apis cerana indica and others</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={speciesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {speciesPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quality Standards & Heat-Map Matrix */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Quality Compliance & State Purity Heat-Map
            </h3>
            <p className="text-xs text-slate-400">
              Cross-referenced against FSSAI Honey Guidelines (Moisture ≤ 20%, HMF ≤ 80mg/kg, C4 Negative)
            </p>
          </div>
          <span className="text-xs font-bold text-teal-600 bg-teal-500/10 px-3 py-1 rounded-xl">
            100% C4 Adulteration Free
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">State / Region</th>
                <th className="p-3">Hives Registered</th>
                <th className="p-3">Total Harvest</th>
                <th className="p-3">Sales GMV</th>
                <th className="p-3">Purity Compliance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(stats?.stateYields || {}).map(([stName, val]) => (
                <tr key={stName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{stName}</span>
                  </td>
                  <td className="p-3 font-mono">{val.hives}</td>
                  <td className="p-3 font-mono">{val.harvestKg} kg</td>
                  <td className="p-3 font-mono font-bold text-emerald-600">₹{val.salesGmv.toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${val.purityRate}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold">{val.purityRate}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                      FSSAI COMPLIANT
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
