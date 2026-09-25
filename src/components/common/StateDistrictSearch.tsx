import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building2,
  Boxes,
  Scale,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Search,
  Award,
  FileText,
  Filter,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Users,
  Activity,
} from 'lucide-react';
import { fetchRegionalSearchData, RegionalSearchResult, RegionalLabReportResult } from '../../services/regionalSearchService';
import { useLanguage } from '../../context/LanguageContext';

export interface StateDistrictSearchProps {
  role: 'CONSUMER' | 'ADMIN' | 'LAB' | 'BEEKEEPER';
  initialState?: string;
  initialDistrict?: string;
  onSelectBatch?: (batchId: string) => void;
  className?: string;
  viewMode?: 'full' | 'compact';
}

export const StateDistrictSearch: React.FC<StateDistrictSearchProps> = ({
  role,
  initialState = 'Punjab',
  initialDistrict = '',
  onSelectBatch,
  className = '',
  viewMode = 'full',
}) => {
  const { t } = useLanguage();

  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [searchData, setSearchData] = useState<RegionalSearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'apiaries' | 'batches'>('overview');

  // Load regional data whenever state or district changes
  const loadData = async (st: string, dist?: string) => {
    setLoading(true);
    try {
      const data = await fetchRegionalSearchData(st, dist);
      setSearchData(data);
    } catch (err) {
      console.error('Failed to load regional search data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedState, selectedDistrict);
  }, [selectedState, selectedDistrict]);

  const statesList = searchData?.availableStates?.length
    ? searchData.availableStates
    : [
        'Himachal Pradesh',
        'Jammu & Kashmir',
        'Karnataka',
        'Kerala',
        'Madhya Pradesh',
        'Maharashtra',
        'Punjab',
        'Rajasthan',
        'Tamil Nadu',
        'Uttar Pradesh',
        'Uttarakhand',
        'West Bengal',
      ];

  const currentDistricts = selectedState && searchData?.districtsByState?.[selectedState]
    ? searchData.districtsByState[selectedState]
    : [];

  const handleStateChange = (newSt: string) => {
    setSelectedState(newSt);
    setSelectedDistrict(''); // Reset district when state changes
  };

  // Role-specific badges and headers
  const getRoleHeader = () => {
    if (role === 'ADMIN') {
      return {
        badge: 'Admin Geographical Ledger & Purity Audit',
        title: 'State & District Honey Traceability Inspector',
        desc: 'Official apiculture oversight: Verify apiary registrations, active hive telemetry, harvest yields, and NABL lab certificates by geographical territory.',
      };
    }
    if (role === 'LAB') {
      return {
        badge: 'NABL & FSSAI Territory Analysis',
        title: 'Regional Honey Purity & Laboratory Testing Explorer',
        desc: 'Accredited testing facility view: Inspect regional batch origins, purity chromatography, C4 sugar screening, and cross-lab certified parameters.',
      };
    }
    if (role === 'BEEKEEPER') {
      return {
        badge: 'Beekeeper Regional Yield & Apiary Network',
        title: 'Regional Honey Production & Quality Directory',
        desc: 'Compare regional floral flow, active colony numbers, harvest volumes, and NABL laboratory reports in your state and neighboring districts.',
      };
    }
    return {
      badge: 'Certified Honey Origin Transparency',
      title: 'Search Honey by State & District',
      desc: 'Discover authentic, 100% pure raw honey directly from verified beekeepers. Track hive count, total harvest kg, and NABL purity certificates in your area.',
    };
  };

  const headerInfo = getRoleHeader();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/20 backdrop-blur-md text-slate-950 text-xs font-bold border border-slate-950/15">
            <MapPin className="w-3.5 h-3.5 fill-slate-950/40" />
            <span>{headerInfo.badge}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {headerInfo.title}
          </h2>

          <p className="text-xs md:text-sm font-medium text-slate-900/90 leading-relaxed max-w-2xl">
            {headerInfo.desc}
          </p>

          {/* Quick Selectors Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* State Selector */}
            <div className="flex-1 min-w-[200px] bg-white/95 dark:bg-slate-900/95 rounded-2xl p-1.5 shadow-md flex items-center gap-2 border border-slate-900/10">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-2">State:</span>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden py-1 pr-3 cursor-pointer"
              >
                {statesList.map((st) => (
                  <option key={st} value={st} className="text-slate-900 bg-white dark:bg-slate-900">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* District Selector */}
            <div className="flex-1 min-w-[200px] bg-white/95 dark:bg-slate-900/95 rounded-2xl p-1.5 shadow-md flex items-center gap-2 border border-slate-900/10">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-2">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden py-1 pr-3 cursor-pointer"
              >
                <option value="" className="text-slate-900 bg-white dark:bg-slate-900">
                  All Districts in {selectedState}
                </option>
                {currentDistricts.map((dist) => (
                  <option key={dist} value={dist} className="text-slate-900 bg-white dark:bg-slate-900">
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadData(selectedState, selectedDistrict)}
              disabled={loading}
              className="p-3 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Apiaries / Beekeepers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Apiaries / Beekeepers
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : searchData?.totalApiaries ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">Registered</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedDistrict ? `Apiaries in ${selectedDistrict}` : `Across all districts in ${selectedState}`}
          </p>
        </div>

        {/* Metric 2: Total Active Hives */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Hives
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : searchData?.totalActiveHives ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / {loading ? '...' : searchData?.totalHives ?? 0} total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {role === 'ADMIN'
              ? 'IoT-monitored colonies transmitting telemetry'
              : 'Healthy, actively foraging honey colonies'}
          </p>
        </div>

        {/* Metric 3: Total Honey Quantity Produced / Harvested (kg) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Honey Harvested (kg)
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : `${searchData?.totalHarvestKg ?? 0}`}
            </span>
            <span className="text-xs font-semibold text-slate-500">kg extracted</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Single-origin cold extraction from local flora
          </p>
        </div>

        {/* Metric 4: Certified Lab Reports */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lab Reports
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {loading ? '...' : searchData?.labReports?.length ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">NABL tested</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {role === 'LAB'
              ? 'FSSAI chemical & C4 residue reports'
              : 'Verified with blockchain cryptographic hash'}
          </p>
        </div>
      </div>

      {/* Tabs navigation for deeper inspection */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Lab Reports & Purity Analysis ({searchData?.labReports?.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('apiaries')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'apiaries'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Local Apiaries & Beekeepers ({searchData?.totalApiaries ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'batches'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Regional Batches ({searchData?.batches?.length ?? 0})</span>
        </button>
      </div>

      {/* Tab 1: Detailed Lab Reports List (Required: Purity %, Pass/Fail, Lab Name) */}
      {(activeTab === 'overview' || activeTab === 'reports') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-500" />
                <span>
                  Lab Reports for Batches from {selectedDistrict ? `${selectedDistrict}, ` : ''}{selectedState}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Official NABL-accredited laboratory testing verification showing purity percentage, pass/fail status, and testing facility.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {searchData?.labReports?.length ?? 0} certified report(s)
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Querying Firestore lab reports for {selectedState}...</p>
            </div>
          ) : !searchData?.labReports || searchData.labReports.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Lab Reports Found for Selected Territory
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No testing reports have been recorded yet for batches originating from {selectedDistrict ? `${selectedDistrict}, ` : ''}{selectedState}. Try selecting another district or state.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchData.labReports.map((report) => {
                const isPass = report.passFail === 'Pass' || report.verdict === 'PURE';
                const isBorderline = report.verdict === 'SUB_STANDARD';

                return (
                  <div
                    key={report.reportId}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition space-y-4"
                  >
                    {/* Header: Report ID & Pass/Fail Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {report.reportId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Batch: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{report.batchId}</span>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {report.floralSource || 'Single-Origin Raw Honey'}
                        </h4>
                      </div>

                      {/* Pass / Fail Badge */}
                      <div className="shrink-0">
                        {isPass ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PASS</span>
                          </span>
                        ) : isBorderline ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-extrabold border border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>BORDERLINE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 text-xs font-extrabold border border-rose-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>FAIL</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Purity % & Accredited Lab Name */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4 border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Certified Purity
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {report.purityPercentage}%
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {isPass ? 'Pure Honey' : 'Adulterated'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right max-w-[210px]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Testing Laboratory
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                          {report.labName}
                        </span>
                        {report.accreditationNo && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-mono">
                            {report.accreditationNo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Parameters Details (Moisture, HMF, C4 Sugars, Test Date) */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-medium">Moisture</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {report.parameters?.moisture ? `${report.parameters.moisture}%` : '17.6%'}
                        </span>
                        <span className="text-[9px] text-slate-400 block">(Std ≤20%)</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-medium">C4 Sugars</span>
                        <span className={`font-bold ${report.parameters?.c4Sugars === 'Positive' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {report.parameters?.c4Sugars || (isPass ? 'Negative' : 'Positive')}
                        </span>
                        <span className="text-[9px] text-slate-400 block">(Cane/Corn)</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-medium">Test Date</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {report.testDate || '2026-09-19'}
                        </span>
                        <span className="text-[9px] text-slate-400 block">NABL Log</span>
                      </div>
                    </div>

                    {/* Action footer */}
                    {onSelectBatch && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => onSelectBatch(report.batchId)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                        >
                          <span>Inspect Batch Traceability</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Apiaries & Beekeepers List */}
      {activeTab === 'apiaries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>
                  Apiaries in {selectedDistrict ? `${selectedDistrict}, ` : ''}{selectedState}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Verified registered apiculture units with Madhukranti portal complement and trust scores.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total: {searchData?.totalApiaries ?? 0}
            </span>
          </div>

          {!searchData?.beekeepers || searchData.beekeepers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No registered apiaries found in this specific territory.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchData.beekeepers.map((bk) => (
                <div
                  key={bk.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-amber-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                        {bk.beekeeperId}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{bk.name}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bk.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {bk.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{bk.district}, {bk.state}</span>
                  </p>

                  <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Trust Score:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{bk.trustScore}/100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Batches List */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-500" />
                <span>
                  Aggregated Honey Batches from {selectedDistrict ? `${selectedDistrict}, ` : ''}{selectedState}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Honey batches prepared, verified, and dispatched for accredited laboratory certification.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total: {searchData?.batches?.length ?? 0}
            </span>
          </div>

          {!searchData?.batches || searchData.batches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No batches recorded yet for this area.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchData.batches.map((batch) => (
                <div
                  key={batch.batchId}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-amber-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {batch.batchId}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{batch.floralSource} Honey</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {batch.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Total Quantity:</span>
                    <span className="font-black text-slate-900 dark:text-white">{batch.totalQuantityKg} kg</span>
                  </div>

                  {batch.labVerdict && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Lab Verdict:</span>
                      <span
                        className={`font-bold ${
                          batch.labVerdict === 'PURE'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {batch.labVerdict}
                      </span>
                    </div>
                  )}

                  {onSelectBatch && (
                    <button
                      onClick={() => onSelectBatch(batch.batchId)}
                      className="w-full mt-2 py-1.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl transition text-center"
                    >
                      View Batch Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
