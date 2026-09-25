import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  RotateCcw,
  Scale,
  Award,
  ChevronRight,
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
import { LabSample, LabReport } from '../../types';

interface LabAnalyticsViewProps {
  labId?: string;
  samples?: LabSample[];
  reports?: Record<string, LabReport>;
  onSelectSample?: (sampleId: string) => void;
  initialTab?: 'charts' | 'map' | 'ai_insights';
}

interface AILabInsights {
  summary: string;
  regionalPatterns: Array<{
    region: string;
    purityTrend: string;
    avgMoisture: number;
    avgHmf: number;
    observation: string;
  }>;
  flaggedAnomalies: Array<{
    target: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    issue: string;
    recommendedAction: string;
  }>;
  workloadMetrics: {
    avgTurnaroundHours: number;
    completedThisMonth: number;
    passRatePercent: number;
    throughputAdvice: string;
  };
  complianceNotes: string[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export const LabAnalyticsView: React.FC<LabAnalyticsViewProps> = ({
  labId = 'LAB_CBRTI_PUNE',
  samples: propSamples,
  reports: propReports,
  onSelectSample,
  initialTab = 'charts',
}) => {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'charts' | 'map' | 'ai_insights'>(initialTab);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<AILabInsights | null>(null);

  // Fallback to sample data master
  const batches = SAMPLE_DATA_MASTER.batches;
  const labReports = SAMPLE_DATA_MASTER.labReports;

  // Fetch Lab AI Insights
  const fetchLabAI = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/lab-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labId,
          sampleSummary: {
            totalBatches: batches.length,
            pureCount: batches.filter((b) => b.labVerdict === 'PURE').length,
            adulteratedCount: batches.filter((b) => b.labVerdict === 'SUB_STANDARD' || (b.labVerdict as string) === 'ADULTERATED').length,
            reportsCount: labReports.length,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setAiInsights(data.insights);
      }
    } catch (e) {
      console.error('Failed to load lab AI insights:', e);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchLabAI();
  }, []);

  // 1. Samples Tested Over Time (6-Month Historical Throughput)
  const throughputData = [
    { month: 'May', tested: 24, pure: 23, flagged: 1, avgHours: 32 },
    { month: 'Jun', tested: 28, pure: 27, flagged: 1, avgHours: 30 },
    { month: 'Jul', tested: 35, pure: 33, flagged: 2, avgHours: 26 },
    { month: 'Aug', tested: 42, pure: 40, flagged: 2, avgHours: 25 },
    { month: 'Sep', tested: 48, pure: 46, flagged: 2, avgHours: 24 },
    { month: 'Oct (Est)', tested: 52, pure: 50, flagged: 2, avgHours: 22 },
  ];

  // 2. Pass / Fail Status Breakdown (Donut Data)
  const statusPieData = [
    { name: 'Pure / Certified (FSSAI)', value: 36, color: '#10b981' },
    { name: 'Adulterated / Rejected', value: 2, color: '#ef4444' },
    { name: 'In Progress / Secondary Testing', value: 6, color: '#f59e0b' },
    { name: 'Pending Sample Intake', value: 4, color: '#3b82f6' },
  ];

  // 3. Average Purity & Moisture by Region (Testing Laboratory Audit)
  const regionalPurityData = [
    { state: 'Punjab', avgMoisture: 17.2, avgHmf: 12.5, passRate: 98 },
    { state: 'Himachal', avgMoisture: 16.8, avgHmf: 8.4, passRate: 100 },
    { state: 'UP', avgMoisture: 18.2, avgHmf: 15.1, passRate: 95 },
    { state: 'Maharashtra', avgMoisture: 18.9, avgHmf: 18.2, passRate: 94 },
    { state: 'Bihar', avgMoisture: 17.6, avgHmf: 13.0, passRate: 97 },
    { state: 'Kerala', avgMoisture: 19.1, avgHmf: 21.0, passRate: 92 },
  ];

  // 4. Testing Turnaround Time (TAT Breakdown in hours)
  const tatBreakdownData = [
    { stage: 'Sample Intake & Logging', hours: 3 },
    { stage: 'Sensory & Moisture Refractometry', hours: 5 },
    { stage: 'Spectroscopic Sugar Profile (F/G)', hours: 8 },
    { stage: 'C4 Carbon Isotope Mass Spec', hours: 6 },
    { stage: 'Report Signing & Blockchain Seal', hours: 2 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Header & Role Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent p-6 rounded-3xl border border-teal-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-slate-950">
              Accredited Laboratory Analytics
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400">
              <Award className="w-3.5 h-3.5" />
              NABL TC-0841 • ISO-17025
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Lab Intelligence & Testing Trends
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Monitor sample turnaround metrics, track regional adulteration rates, review C4 chromatography trends, and explore AI quality pattern analysis for honey batches across India.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'charts'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Testing Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Tested Batches Map</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_insights')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ai_insights'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Lab AI Insights</span>
          </button>
        </div>
      </div>

      {/* 1. MAP TAB: Geographic Spread of Tested/Pending Batches */}
      {activeTab === 'map' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-500" />
                <span>Geographic Spread of Batches & Testing Samples</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect apiaries whose batches are pending, under analysis, or completed by accredited laboratories.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('charts')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Back to Lab Charts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <IndiaHivesMap role="LAB" heightClass="h-[520px]" />
        </section>
      )}

      {/* 2. CHARTS & METRICS TAB */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Key Metric Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Total Samples Screened</span>
                <FlaskConical className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">48 Lots</div>
              <div className="text-[11px] text-teal-600 dark:text-teal-400 font-bold mt-1">
                96.2% Statutory Purity Pass Rate
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Avg Lab Turnaround (TAT)</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">24 Hours</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                35% faster via digital hash stamping
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>C4 Adulteration Detected</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">2 Batches</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Flagged & blocked before retail packaging
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Blockchain Sealed Reports</span>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">38 Reports</div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">
                Immutable SHA-256 Ledger Blocks
              </div>
            </div>
          </div>

          {/* Charts Row 1: Throughput over Time & Pass/Fail Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Samples Tested Over Time */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Testing Throughput & Pure vs Flagged Batches
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Monthly laboratory volume and purity verification trend.
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 text-xs font-bold">
                  6-Month Trend
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="pure" name="Pure / Passed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="flagged" name="Adulterated / Flagged" fill="#ef4444" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Sample Status & Quality Breakdown (Donut) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Sample Queue & Accreditation Status
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Distribution of active lots undergoing spectroscopic evaluation.
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                  Active Queue
                </span>
              </div>

              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Regional Moisture / Purity & TAT Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Regional Moisture & Purity Comparison */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Regional Moisture vs Statutory 20% Standard
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Average moisture content across samples by state of origin.
                  </p>
                </div>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalPurityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                    <YAxis domain={[14, 22]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Avg Moisture']}
                    />
                    <Bar dataKey="avgMoisture" name="Tested Moisture (%)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Testing Stage Turnaround Time (TAT) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Turnaround Time (TAT) by Testing Stage
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Total average turnaround: 24.0 hours from intake to ledger hashing.
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 text-xs font-bold">
                  Target &lt; 36h
                </span>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tatBreakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any) => [`${val} Hours`, 'Duration']}
                    />
                    <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                      {tatBreakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GEMINI AI LAB INSIGHTS TAB */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-500" />
                <span>Gemini AI Quality Intelligence & Anomaly Detection</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated surveillance across batch spectroscopy, regional harvest moisture shifts, and C4 chromatography curves.
              </p>
            </div>

            <button
              onClick={fetchLabAI}
              disabled={loadingAI}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-sm self-start sm:self-auto disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
              <span>{loadingAI ? 'Analyzing...' : 'Re-Run Pattern Analysis'}</span>
            </button>
          </div>

          {aiInsights && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="p-5 rounded-3xl bg-teal-500/10 border border-teal-500/30 text-teal-900 dark:text-teal-200 text-sm font-semibold flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
                    Auditor Synopsis
                  </span>
                  {aiInsights.summary}
                </div>
              </div>

              {/* Regional Patterns Analysis Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Regional Quality Patterns & Seasonal Moisture Shifts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiInsights.regionalPatterns.map((rp, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-teal-500" />
                          <span>{rp.region}</span>
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            rp.purityTrend === 'Exemplary'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {rp.purityTrend}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-[10px] text-slate-400 block font-semibold">Avg Moisture</span>
                          <strong className="text-slate-800 dark:text-slate-200">{rp.avgMoisture}%</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-[10px] text-slate-400 block font-semibold">Avg HMF</span>
                          <strong className="text-slate-800 dark:text-slate-200">{rp.avgHmf} mg/kg</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rp.observation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flagged Anomalies & Recommended Lab Actions */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Flagged Anomalies & Quality Interventions</span>
                </h3>

                <div className="space-y-3">
                  {aiInsights.flaggedAnomalies.map((anom, idx) => (
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
                          <strong className="text-slate-900 dark:text-white font-bold">{anom.target}</strong>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{anom.issue}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-teal-700 dark:text-teal-300 sm:max-w-xs shrink-0">
                        <strong>Lab Action:</strong> {anom.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance & Calibration Notes */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span>Statutory Standards Compliance (FSSAI Gazette 2024 / NABL ISO-17025)</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {aiInsights.complianceNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
