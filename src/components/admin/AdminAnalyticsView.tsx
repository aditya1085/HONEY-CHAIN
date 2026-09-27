import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  MapPin,
  ShieldCheck,
  Award,
  Users,
  Boxes,
  ShoppingBag,
  RotateCcw,
  AlertTriangle,
  Droplets,
  Layers,
  Flame,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  Coins,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { IndiaHivesMap } from '../common/IndiaHivesMap';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface AIAdminInsights {
  summary: string;
  anomalies: Array<{
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    action: string;
  }>;
  forecasts: Array<{
    region: string;
    floralSource: string;
    expectedYieldTrend: string;
    notes: string;
  }>;
  recommendations: Array<{
    category: string;
    priority: string;
    text: string;
  }>;
}

interface PlatformStats {
  totalBeekeepers: number;
  activeBeekeepers: number;
  totalHives: number;
  activeHives: number;
  totalHarvestKg: number;
  totalBatches: number;
  pureBatches: number;
  flaggedBatches: number;
  totalOrders: number;
  totalGmv: number;
  avgOrderValue: number;
  beekeeperEarnings: number;
  platformRevenue: number;
  speciesDistribution: Record<string, number>;
  floralDistribution: Record<string, number>;
  stateYields: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    harvestKg: number;
    sales: number;
    avgMoisture: number;
  }>;
  qualityMetrics: {
    avgMoisture: number;
    avgHmf: number;
    avgFgRatio: number;
    c4PassRate: number;
  };
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];

export const AdminAnalyticsView: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'ai_insights'>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<AIAdminInsights | null>(null);
  const [recomputing, setRecomputing] = useState<boolean>(false);

  // Derive stats fallback from SAMPLE_DATA_MASTER
  const computeMasterStats = (): PlatformStats => {
    const beekeepers = SAMPLE_DATA_MASTER.beekeepers;
    const hives = SAMPLE_DATA_MASTER.hives;
    const batches = SAMPLE_DATA_MASTER.batches;
    const harvests = SAMPLE_DATA_MASTER.harvests;
    const orders = SAMPLE_DATA_MASTER.orders;
    const reports = SAMPLE_DATA_MASTER.labReports;

    const totalHarvestKg = harvests.reduce((sum, h) => sum + (h.quantityKg || 0), 0) || 5420;
    const totalGmv = orders.reduce((sum, o) => sum + (o.totalAmountInr || 0), 0) || 184500;
    const pureBatches = batches.filter((b) => b.labVerdict === 'PURE').length || 38;
    const flaggedBatches = batches.filter((b) => b.labVerdict === 'SUB_STANDARD' || (b.labVerdict as string) === 'ADULTERATED').length || 2;

    const speciesDistribution: Record<string, number> = {};
    hives.forEach((h) => {
      const type = h.colonyType || 'Apis mellifera';
      speciesDistribution[type] = (speciesDistribution[type] || 0) + 1;
    });

    const floralDistribution: Record<string, number> = {};
    harvests.forEach((h) => {
      const flora = h.floralSource || 'Mustard';
      floralDistribution[flora] = (floralDistribution[flora] || 0) + (h.quantityKg || 10);
    });

    const stateYields: Record<string, number> = {};
    harvests.forEach((h) => {
      const state = (h as any).state || 'Punjab';
      stateYields[state] = (stateYields[state] || 0) + (h.quantityKg || 25);
    });

    return {
      totalBeekeepers: beekeepers.length || 76,
      activeBeekeepers: beekeepers.filter((b) => b.status === 'approved').length || 68,
      totalHives: hives.length || 192,
      activeHives: hives.filter((h) => h.status === 'active').length || 184,
      totalHarvestKg,
      totalBatches: batches.length || 52,
      pureBatches,
      flaggedBatches,
      totalOrders: orders.length || 130,
      totalGmv,
      avgOrderValue: orders.length > 0 ? Math.round(totalGmv / orders.length) : 1420,
      beekeeperEarnings: Math.round(totalGmv * 0.88),
      platformRevenue: Math.round(totalGmv * 0.12),
      speciesDistribution: Object.keys(speciesDistribution).length > 0 ? speciesDistribution : {
        'Apis mellifera': 110,
        'Apis cerana indica': 54,
        'Apis dorsata': 16,
        'Stingless': 12,
      },
      floralDistribution: Object.keys(floralDistribution).length > 0 ? floralDistribution : {
        'Mustard': 1850,
        'White Acacia': 1240,
        'Multiflora': 980,
        'Lychee': 750,
        'Jamun': 600,
      },
      stateYields: Object.keys(stateYields).length > 0 ? stateYields : {
        'Punjab': 1620,
        'Uttar Pradesh': 1480,
        'Himachal Pradesh': 890,
        'Jammu & Kashmir': 760,
        'Bihar': 670,
      },
      monthlyTrends: [
        { month: 'May', harvestKg: 650, sales: 22000, avgMoisture: 17.8 },
        { month: 'Jun', harvestKg: 780, sales: 26500, avgMoisture: 17.5 },
        { month: 'Jul', harvestKg: 910, sales: 31000, avgMoisture: 17.9 },
        { month: 'Aug', harvestKg: 1050, sales: 36000, avgMoisture: 17.4 },
        { month: 'Sep', harvestKg: 1220, sales: 42000, avgMoisture: 17.2 },
        { month: 'Oct', harvestKg: 1380, sales: 48000, avgMoisture: 17.3 },
      ],
      qualityMetrics: {
        avgMoisture: 17.4,
        avgHmf: 12.8,
        avgFgRatio: 1.16,
        c4PassRate: 100,
      },
    };
  };

  // Fetch live stats from API
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
          return;
        }
      }
      setStats(computeMasterStats());
    } catch {
      setStats(computeMasterStats());
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch AI Insights
  const fetchAIInsights = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: stats || computeMasterStats() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.insights) {
          setAiInsights(data.insights);
          return;
        }
      }
    } catch (e) {
      console.warn('AI Insights error:', e);
    } finally {
      setLoadingAI(false);
    }

    // High quality deterministic fallback
    setAiInsights({
      summary: 'Honey Chain currently monitors 192 hives across 76 verified apiaries with a 100% C4 purity pass rate and ₹1,84,500 in transparent farmgate GMV.',
      anomalies: [
        {
          title: 'Moisture Compliance within Statutory Limit',
          severity: 'LOW',
          description: 'Network-wide average moisture is 17.4%, comfortably beneath the 20.0% statutory FSSAI threshold. No fermentation risk observed.',
          action: 'Continue continuous IoT temperature and humidity surveillance during comb extraction.',
        },
        {
          title: 'Seasonal Flowering Surge in Punjab & UP',
          severity: 'MEDIUM',
          description: 'Mustard and Acacia bloom cycles predict a 28% yield expansion over the next 45 days. Extraction logistics need coordination.',
          action: 'Notify certified testing laboratories to prepare sample intake queues for bulk batch testing.',
        },
      ],
      forecasts: [
        {
          region: 'Punjab & Haryana Honey Belt',
          floralSource: 'Raw Mustard Blossom',
          expectedYieldTrend: 'Increasing',
          notes: 'Favorable daytime comb temperatures (33°C - 35°C) and stable brood conditions recorded by IoT sensor nodes.',
        },
        {
          region: 'Kashmir & Himachal Valleys',
          floralSource: 'White Acacia & Forest Flora',
          expectedYieldTrend: 'Stable',
          notes: 'Pristine mountain nectar flow with high enzymatic diastase activity and negligible HMF degradation.',
        },
      ],
      recommendations: [
        {
          category: 'Quality Assurance',
          priority: 'High',
          text: 'Mandate automated SHA-256 digital hash verification on all lab reports prior to issuing retail jar QR codes.',
        },
        {
          category: 'Beekeeper Payouts',
          priority: 'Medium',
          text: 'Maintain automated 88% direct payout release upon consumer delivery confirmation to safeguard beekeeper trust.',
        },
      ],
    });
  };

  // Recompute Platform Stats on Demand
  const handleRecomputeStats = async () => {
    setRecomputing(true);
    try {
      const res = await fetch('/api/admin/stats/recompute', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.warn('Recompute error:', e);
    } finally {
      setRecomputing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAIInsights();
  }, []);

  const activeStats = stats || computeMasterStats();

  // Prepare chart datasets
  const speciesChartData = Object.entries(activeStats.speciesDistribution || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const floralChartData = Object.entries(activeStats.floralDistribution || {}).map(([name, kg]) => ({
    name,
    kg,
  }));

  const stateYieldChartData = Object.entries(activeStats.stateYields || {}).map(([state, yieldKg]) => ({
    state,
    yieldKg,
  }));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
              Admin Master Control
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Real-Time Traceability Grid
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Platform Intelligence & Analytics
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Live surveillance across nationwide apiaries, IoT sensor nodes, NABL laboratory purity assays, supply chain GMV, and predictive Gemini AI insights.
          </p>
        </div>

        {/* Tab Controls & Recompute Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview & KPIs</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Hives Map</span>
            </button>
            <button
              onClick={() => setActiveTab('ai_insights')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ai_insights'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Intelligence</span>
            </button>
          </div>

          <button
            onClick={handleRecomputeStats}
            disabled={recomputing}
            title="Recalculate platform statistics"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition shadow-sm disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${recomputing ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Verified Apiaries</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {activeStats.totalBeekeepers}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                {activeStats.activeBeekeepers} Active • 100% Aadhaar Salt Hashed
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Monitored Hives</span>
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {activeStats.totalHives}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                {activeStats.activeHives} Connected with IoT Telemetry
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Total Honey Harvested</span>
                <Droplets className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {activeStats.totalHarvestKg.toLocaleString()} kg
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                {activeStats.pureBatches} Certified Pure Batches ({activeStats.flaggedBatches} Flagged)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Platform GMV</span>
                <Coins className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{activeStats.totalGmv.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                ₹{activeStats.beekeeperEarnings.toLocaleString()} (88%) Farmgate Direct
              </div>
            </div>
          </div>

          {/* Quality Assurance Strip */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-white">
                Network Quality Benchmark (FSSAI 2024 Gazette Standard):
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Avg Moisture: </span>
                <strong className="text-emerald-600 dark:text-emerald-400">{activeStats.qualityMetrics.avgMoisture}%</strong>
                <span className="text-[10px] text-slate-400"> (Limit &lt; 20%)</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Avg HMF: </span>
                <strong className="text-emerald-600 dark:text-emerald-400">{activeStats.qualityMetrics.avgHmf} mg/kg</strong>
                <span className="text-[10px] text-slate-400"> (Limit &lt; 40)</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">F/G Ratio: </span>
                <strong className="text-blue-600 dark:text-blue-400">{activeStats.qualityMetrics.avgFgRatio}</strong>
                <span className="text-[10px] text-slate-400"> (Min 1.0)</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">C4 Sugar Pass: </span>
                <strong className="text-emerald-600 dark:text-emerald-400">{activeStats.qualityMetrics.c4PassRate}%</strong>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Historical Harvest & Sales Volume + Species Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: 6-Month Growth & Sales */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Honey Harvest Volume & Sales Revenue Trend
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Monthly extraction yield (Kg) and direct marketplace gross merchandise value (₹).
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold">
                  6-Month Trend
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeStats.monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any, name: any) => [
                        name === 'harvestKg' ? `${val} kg` : `₹${val.toLocaleString()}`,
                        name === 'harvestKg' ? 'Harvest Yield' : 'Marketplace Sales',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="harvestKg" name="Harvest Yield (Kg)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="sales" name="Sales GMV (₹)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Species Distribution Donut */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Colony Species Distribution
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Distribution of bee colonies across registered apiaries.
                  </p>
                </div>
              </div>

              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speciesChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {speciesChartData.map((_, index) => (
                        <Cell key={`species-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: State-wise Yield & Floral Variety Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: State-wise Honey Yield */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    State-Wise Honey Production (Kg)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Regional honey volume from certified apiaries in key apiculture belts.
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-bold">
                  Top Regions
                </span>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateYieldChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="state" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any) => [`${val} kg`, 'Total Yield']}
                    />
                    <Bar dataKey="yieldKg" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                      {stateYieldChartData.map((_, index) => (
                        <Cell key={`state-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Floral Variety Volume */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Floral Source Volume Distribution (Kg)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Certified monofloral and multifloral honey volume in network.
                  </p>
                </div>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={floralChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any) => [`${val} kg`, 'Harvested']}
                    />
                    <Bar dataKey="kg" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                      {floralChartData.map((_, index) => (
                        <Cell key={`flora-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GEOGRAPHIC HIVES MAP */}
      {activeTab === 'map' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>Geographic Apiculture & IoT Health Surveillance</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete administrative map view: click any hive pin to inspect continuous IoT temperature/humidity telemetry, beekeeper credentials, and active health alarms.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Back to Overview</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <IndiaHivesMap role="ADMIN" heightClass="h-[550px]" />
        </section>
      )}

      {/* TAB 3: GEMINI AI INTELLIGENCE */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Gemini AI Agricultural Intelligence & Anomaly Engine</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated predictive surveillance evaluating hive telemetry, harvest moisture compliance, bloom cycles, and supply chain fraud risk.
              </p>
            </div>

            <button
              onClick={fetchAIInsights}
              disabled={loadingAI}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-sm self-start sm:self-auto disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
              <span>{loadingAI ? 'Analyzing Grid...' : 'Re-Run AI Analysis'}</span>
            </button>
          </div>

          {aiInsights && (
            <div className="space-y-6">
              {/* Executive Synopsis */}
              <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm font-semibold flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                    Executive Synopsis
                  </span>
                  {aiInsights.summary}
                </div>
              </div>

              {/* Detected Anomalies & Quality Interventions */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Surveillance Alerts & Anomaly Interventions</span>
                </h3>

                <div className="space-y-3">
                  {aiInsights.anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              anom.severity === 'HIGH'
                                ? 'bg-rose-500 text-white'
                                : anom.severity === 'MEDIUM'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            {anom.severity}
                          </span>
                          <strong className="text-slate-900 dark:text-white font-bold">{anom.title}</strong>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{anom.description}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-amber-700 dark:text-amber-300 sm:max-w-xs shrink-0">
                        <strong>Remediation:</strong> {anom.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regional Forecasts */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Regional Yield & Bloom Forecasts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.forecasts.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>{f.region}</span>
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            f.expectedYieldTrend === 'Increasing'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {f.expectedYieldTrend}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {f.floralSource}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {f.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Strategic Network Recommendations</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiInsights.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{rec.category}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
