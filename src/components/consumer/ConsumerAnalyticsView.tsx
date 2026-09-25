import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Award,
  ShoppingBag,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Sliders,
  Flame,
  Droplets,
  Heart,
  Search,
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
import { CartItem } from '../../types';

interface ConsumerAnalyticsViewProps {
  onNavigateToMarketplace?: () => void;
  onAddToCart?: (item: CartItem) => void;
  onSelectBatch?: (batchId: string) => void;
}

interface AIConsumerRecommendation {
  honeyVariety: string;
  origin: string;
  flavorNotes: string;
  healthBenefit: string;
  matchScore: number;
  whyRecommended: string;
}

interface AIConsumerInsights {
  summary: string;
  recommendations: AIConsumerRecommendation[];
  purityExplanation: {
    moistureMeaning: string;
    hmfMeaning: string;
    c4SugarMeaning: string;
    trustScoreMeaning: string;
  };
  buyingGuidance: Array<{
    comparison: string;
    bestFor: string;
    crystallizationNote: string;
  }>;
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export const ConsumerAnalyticsView: React.FC<ConsumerAnalyticsViewProps> = ({
  onNavigateToMarketplace,
  onAddToCart,
  onSelectBatch,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  // Tab: Overview & Analytics vs Origin Map
  const [activeTab, setActiveTab] = useState<'analytics' | 'map' | 'ai_insights'>('analytics');

  // AI Preferences
  const [tastePreference, setTastePreference] = useState<string>('Floral & Mild');
  const [healthGoal, setHealthGoal] = useState<string>('Immunity & Throat Care');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<AIConsumerInsights | null>(null);

  // Active user order simulation
  const userOrders = [
    { id: 'ORD-2609-1021', date: '2026-09-15', product: 'Raw Mustard Honey (500g)', amount: 480, status: 'Delivered', purity: '100% Pure' },
    { id: 'ORD-2609-1088', date: '2026-09-22', product: 'Kashmir White Acacia (500g)', amount: 750, status: 'In Transit', purity: '100% Pure' },
  ];

  // Fetch AI consumer insights
  const fetchConsumerAI = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/consumer-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tastePreference,
          healthGoal,
          userOrders,
        }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setAiInsights(data.insights);
      }
    } catch (e) {
      console.error('Failed to load consumer AI insights:', e);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchConsumerAI();
  }, []);

  // 1. Purity & Moisture Distribution across available marketplace batches
  const purityMetricsData = [
    { variety: 'Mustard', avgMoisture: 17.2, maxAllowed: 20.0, avgHmf: 12.5, passRate: 100 },
    { variety: 'Acacia', avgMoisture: 16.4, maxAllowed: 20.0, avgHmf: 8.2, passRate: 100 },
    { variety: 'Multiflora', avgMoisture: 18.1, maxAllowed: 20.0, avgHmf: 14.8, passRate: 100 },
    { variety: 'Jamun', avgMoisture: 18.5, maxAllowed: 20.0, avgHmf: 16.0, passRate: 100 },
    { variety: 'Lychee', avgMoisture: 17.8, maxAllowed: 20.0, avgHmf: 11.4, passRate: 100 },
    { variety: 'Eucalyptus', avgMoisture: 17.5, maxAllowed: 20.0, avgHmf: 13.1, passRate: 100 },
  ];

  // 2. Beekeeper Trust Score Comparison
  const beekeeperTrustData = SAMPLE_DATA_MASTER.beekeepers.slice(0, 6).map((b) => ({
    name: b.name.split(' ')[0],
    fullName: b.name,
    trustScore: b.trustScore || 95,
    state: b.state,
    district: b.district,
    hives: (b as any).hiveCount || 20,
  }));

  // 3. Regional Honey Variety Availability (Kg certified in stock)
  const regionalAvailabilityData = [
    { region: 'Punjab', flora: 'Mustard Honey', stockKg: 850 },
    { region: 'J&K', flora: 'White Acacia', stockKg: 420 },
    { region: 'Himachal', flora: 'Multiflora Forest', stockKg: 640 },
    { region: 'Uttar Pradesh', flora: 'Jamun & Sheesham', stockKg: 910 },
    { region: 'Bihar', flora: 'Lychee Blossom', stockKg: 530 },
    { region: 'Maharashtra', flora: 'Wild Forest', stockKg: 380 },
  ];

  // 4. Personal Spending & Honey Intake Summary
  const personalSummary = {
    totalSpent: 1230,
    jarsPurchased: 2,
    totalGrams: 1000,
    verifiedPassRate: '100%',
    farmerDirectSavings: '₹340 vs Supermarket Commercial Blends',
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Header & Role Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
              Consumer Purity Portal
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Farmgate Verified
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Purity Insights & Honey Explorer
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Explore authentic lab purity analytics, compare verified beekeepers, locate certified apiaries across India, and receive personalized AI honey sommelier guidance.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Purity Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Honey Origin Map</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_insights')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ai_insights'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Sommelier</span>
          </button>
        </div>
      </div>

      {/* 1. ORIGIN MAP TAB (When active or switchable) */}
      {activeTab === 'map' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>Verified Apiaries with Honey in Stock</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any pin to inspect the beekeeper's Trust Score, verify pure batch numbers, and view bottled honey ready for dispatch.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Back to Quality Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <IndiaHivesMap role="CONSUMER" heightClass="h-[520px]" />
        </section>
      )}

      {/* 2. ANALYTICS & GRAPHS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Trust & Personal Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Network Purity Pass</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">100.0%</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                Zero C4 Cane/Corn Syrups Detected
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Avg Hive Moisture</span>
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">17.4%</div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                Safe FSSAI threshold is &lt; 20.0%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Your Verified Honey</span>
                <ShoppingBag className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {personalSummary.totalGrams}g
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                Across {personalSummary.jarsPurchased} certified single-origin jars
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Farmgate Advantage</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">88% GMV</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Directly earned by local beekeeper families
              </div>
            </div>
          </div>

          {/* Charts Row 1: Moisture vs Limit & Beekeeper Trust Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Purity & Moisture Quality Comparison */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Moisture Content by Floral Variety (% vs FSSAI Standard)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lower moisture ensures the honey was naturally ripened by bees in comb without artificial drying.
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-bold">
                  FSSAI &lt; 20%
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purityMetricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="variety" tick={{ fontSize: 11 }} />
                    <YAxis domain={[12, 22]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any, name: any) => [
                        `${val}%`,
                        name === 'avgMoisture' ? 'Tested Moisture' : 'Max Statutory Limit',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="avgMoisture" name="Tested Moisture" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="maxAllowed" name="FSSAI Safe Limit (20%)" fill="#64748b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  All available honeys in our catalog average 17.4% moisture, well below the 20% fermentation threshold.
                </span>
              </div>
            </div>

            {/* Chart 2: Beekeeper Trust Score Comparison */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Verified Beekeeper Trust Scores
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Calculated from IoT telemetry compliance, NABL purity results, and verified customer ratings.
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                  Avg 95+ Score
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beekeeperTrustData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" domain={[80, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any) => [`${val}/100`, 'Trust Score']}
                    />
                    <Bar dataKey="trustScore" fill="#10b981" radius={[0, 8, 8, 0]}>
                      {beekeeperTrustData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
                <span>Top Ranked Beekeeper: Sita Ram (97/100, Punjab)</span>
                <button
                  onClick={() => onNavigateToMarketplace?.()}
                  className="font-bold underline text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
                >
                  Shop Sita's Harvest
                </button>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Regional Stock Availability & Personal Spending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Regional Honey Variety Availability */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Regional Honey Variety Stock (Kg Ready for Dispatch)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live inventory bottled directly at origin apiaries across major honey belts.
                  </p>
                </div>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalAvailabilityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any, _, item: any) => [`${val} kg (${item.payload.flora})`, 'Stock Available']}
                    />
                    <Bar dataKey="stockKg" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {regionalAvailabilityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Personal Honey Order & Quality History */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Your Verified Honey Intake & Spending
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Summary of authentic, single-origin honey delivered directly to your household.
                  </p>
                </div>
                <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 text-xs font-bold">
                  ₹{personalSummary.totalSpent} Spent
                </span>
              </div>

              <div className="space-y-2">
                {userOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{ord.product}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {ord.id} • {ord.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600 dark:text-amber-400">₹{ord.amount}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                        {ord.purity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Direct Farmgate Savings:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{personalSummary.farmerDirectSavings}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GEMINI AI INSIGHTS & SOMMELIER TAB */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          {/* Controls: Taste & Health Goal Selector */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Gemini AI Honey Sommelier & Buying Advisor</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your preference to generate tailor-made recommendations and plain-language purity analysis.
                </p>
              </div>

              <button
                onClick={fetchConsumerAI}
                disabled={loadingAI}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-sm self-start sm:self-auto disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
                <span>{loadingAI ? 'Consulting Gemini...' : 'Re-Generate Recommendations'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Flavor & Texture Preference:
                </label>
                <select
                  value={tastePreference}
                  onChange={(e) => setTastePreference(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Floral & Mild">Delicate Floral & Liquid (e.g. Acacia)</option>
                  <option value="Creamy & Crystalline">Thick Creamy & Crystallized (e.g. Raw Mustard)</option>
                  <option value="Dark & Robust">Rich, Woody & Intense (e.g. Wild Forest, Jamun)</option>
                  <option value="Citrus & Fruity">Sweet & Fruity Aromas (e.g. Lychee Blossom)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Primary Health & Wellness Goal:
                </label>
                <select
                  value={healthGoal}
                  onChange={(e) => setHealthGoal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Immunity & Throat Care">Immunity & Cough/Throat Soothing</option>
                  <option value="Low Glycemic Sweetener">Gentle Everyday Tea Sweetener (Low GI)</option>
                  <option value="Antioxidants & Vitality">Maximum Raw Bioactive Antioxidants</option>
                  <option value="Digestive Comfort">Gut Health & Gentle Digestion</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Output Result Cards */}
          {aiInsights && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm font-semibold flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                    AI Sommelier Verdict
                  </span>
                  {aiInsights.summary}
                </div>
              </div>

              {/* Top 3 Personalized Product Recommendations */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Recommended Certified Single-Origin Lots
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiInsights.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {rec.matchScore}% Compatibility
                          </span>
                          <span className="text-xs">🍯</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                          {rec.honeyVariety}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{rec.origin}</span>
                        </div>

                        <div className="space-y-2 text-xs mb-4">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-[10px] font-bold text-slate-400 block">Flavor Profile</span>
                            <span className="text-slate-700 dark:text-slate-200 font-semibold">{rec.flavorNotes}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-[10px] font-bold text-slate-400 block">Health Benefit</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{rec.healthBenefit}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mb-4">
                          "{rec.whyRecommended}"
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigateToMarketplace?.()}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <span>View in Marketplace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plain-Language Purity Explanations Grid */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Plain-Language Guide: Decoding Honey Lab Tests & Trust Scores</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We don't expect you to be an apiculture chemist. Here is what our testing numbers mean for your family's health:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-600 dark:text-amber-400 mb-1">
                      <Droplets className="w-4 h-4 text-amber-500" />
                      <span>Moisture Below 20.0% (Natural Ripening)</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {aiInsights.purityExplanation.moistureMeaning}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-600 dark:text-rose-400 mb-1">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <span>Low HMF Below 40 mg/kg (Zero Heat Damage)</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {aiInsights.purityExplanation.hmfMeaning}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Negative C4 Carbon Isotope Test (No Sugar Syrups)</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {aiInsights.purityExplanation.c4SugarMeaning}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400 mb-1">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span>Beekeeper Trust Score (Continuous Reliability)</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {aiInsights.purityExplanation.trustScoreMeaning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
