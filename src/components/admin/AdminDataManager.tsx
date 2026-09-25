import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Database,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Search,
  Check,
  X,
  Play,
  Activity,
  Sliders,
} from 'lucide-react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

type EntityType =
  | 'beekeepers'
  | 'hives'
  | 'iotDevices'
  | 'sensorReadings'
  | 'harvests'
  | 'batches'
  | 'labReports'
  | 'packages'
  | 'listings'
  | 'orders'
  | 'reviews'
  | 'disputes';

interface EntityDefinition {
  label: string;
  prefix: string;
  fields: { key: string; label: string; type: 'string' | 'number' | 'boolean'; required?: boolean }[];
  templateHeaders: string[];
  sampleRow: Record<string, string | number | boolean>;
}

const ENTITY_CONFIG: Record<EntityType, EntityDefinition> = {
  beekeepers: {
    label: 'Beekeepers',
    prefix: 'BK-',
    fields: [
      { key: 'name', label: 'Full Name', type: 'string', required: true },
      { key: 'state', label: 'State', type: 'string', required: true },
      { key: 'district', label: 'District', type: 'string', required: true },
      { key: 'phone', label: 'Phone', type: 'string' },
      { key: 'madhukrantiId', label: 'Madhukranti ID', type: 'string' },
      { key: 'aadhaarLast4', label: 'Aadhaar Last 4', type: 'string' },
      { key: 'trustScore', label: 'Trust Score', type: 'number' },
      { key: 'status', label: 'Status (approved/pending)', type: 'string' },
    ],
    templateHeaders: ['name', 'state', 'district', 'phone', 'madhukrantiId', 'aadhaarLast4', 'trustScore', 'status'],
    sampleRow: {
      name: 'Rameshwar Singh',
      state: 'Punjab',
      district: 'Hoshiarpur',
      phone: '+91 98765 12345',
      madhukrantiId: 'NBB/PB/2026/1029',
      aadhaarLast4: '9821',
      trustScore: 95,
      status: 'approved',
    },
  },
  hives: {
    label: 'Hives',
    prefix: 'HV-',
    fields: [
      { key: 'beekeeperId', label: 'Beekeeper ID', type: 'string', required: true },
      { key: 'colonyType', label: 'Colony Type', type: 'string', required: true },
      { key: 'hiveType', label: 'Hive Type', type: 'string' },
      { key: 'area', label: 'Area / Flora Zone', type: 'string', required: true },
      { key: 'lat', label: 'Latitude', type: 'number' },
      { key: 'lng', label: 'Longitude', type: 'number' },
      { key: 'iotDeviceId', label: 'IoT Device Serial', type: 'string' },
      { key: 'status', label: 'Status (active/dormant)', type: 'string' },
    ],
    templateHeaders: ['beekeeperId', 'colonyType', 'hiveType', 'area', 'lat', 'lng', 'iotDeviceId', 'status'],
    sampleRow: {
      beekeeperId: 'BK-1001',
      colonyType: 'Apis mellifera',
      hiveType: 'Langstroth',
      area: 'Mustard Orchards, Dasuya',
      lat: 31.8156,
      lng: 75.6587,
      iotDeviceId: 'DEV-1001',
      status: 'active',
    },
  },
  iotDevices: {
    label: 'IoT Devices',
    prefix: 'DEV-',
    fields: [
      { key: 'deviceSerial', label: 'Device Serial', type: 'string', required: true },
      { key: 'hiveId', label: 'Hive ID', type: 'string', required: true },
      { key: 'beekeeperId', label: 'Beekeeper ID', type: 'string' },
      { key: 'status', label: 'Status (active/paired)', type: 'string' },
    ],
    templateHeaders: ['deviceSerial', 'hiveId', 'beekeeperId', 'status'],
    sampleRow: {
      deviceSerial: 'DEV-2026-X1',
      hiveId: 'HV-1001',
      beekeeperId: 'BK-1001',
      status: 'active',
    },
  },
  sensorReadings: {
    label: 'Sensor Readings',
    prefix: 'SR-',
    fields: [
      { key: 'deviceSerial', label: 'Device Serial', type: 'string', required: true },
      { key: 'hiveId', label: 'Hive ID', type: 'string', required: true },
      { key: 'temperature', label: 'Temperature (°C)', type: 'number', required: true },
      { key: 'humidity', label: 'Humidity (%)', type: 'number', required: true },
      { key: 'weight', label: 'Weight (kg)', type: 'number', required: true },
      { key: 'battery', label: 'Battery (%)', type: 'number' },
    ],
    templateHeaders: ['deviceSerial', 'hiveId', 'temperature', 'humidity', 'weight', 'battery'],
    sampleRow: {
      deviceSerial: 'DEV-1001',
      hiveId: 'HV-1001',
      temperature: 34.6,
      humidity: 62.4,
      weight: 38.5,
      battery: 95,
    },
  },
  harvests: {
    label: 'Harvests',
    prefix: 'HRV-',
    fields: [
      { key: 'beekeeperId', label: 'Beekeeper ID', type: 'string', required: true },
      { key: 'hiveId', label: 'Hive ID', type: 'string', required: true },
      { key: 'floralSource', label: 'Floral Source', type: 'string', required: true },
      { key: 'quantityKg', label: 'Harvest (kg)', type: 'number', required: true },
      { key: 'moisture', label: 'Moisture (%)', type: 'number' },
      { key: 'state', label: 'State', type: 'string' },
    ],
    templateHeaders: ['beekeeperId', 'hiveId', 'floralSource', 'quantityKg', 'moisture', 'state'],
    sampleRow: {
      beekeeperId: 'BK-1001',
      hiveId: 'HV-1001',
      floralSource: 'Mustard',
      quantityKg: 25.5,
      moisture: 17.8,
      state: 'Punjab',
    },
  },
  batches: {
    label: 'Batches',
    prefix: 'HB-',
    fields: [
      { key: 'batchId', label: 'Batch ID', type: 'string', required: true },
      { key: 'floralSource', label: 'Floral Source', type: 'string', required: true },
      { key: 'originState', label: 'Origin State', type: 'string', required: true },
      { key: 'totalWeightKg', label: 'Total Weight (kg)', type: 'number' },
      { key: 'labVerdict', label: 'Lab Verdict (PURE/ADULTERATED)', type: 'string' },
      { key: 'status', label: 'Status (packaged/verified/testing)', type: 'string' },
    ],
    templateHeaders: ['batchId', 'floralSource', 'originState', 'totalWeightKg', 'labVerdict', 'status'],
    sampleRow: {
      batchId: 'HB-2026-PB-1001',
      floralSource: 'Mustard',
      originState: 'Punjab',
      totalWeightKg: 120,
      labVerdict: 'PURE',
      status: 'packaged',
    },
  },
  labReports: {
    label: 'Lab Reports',
    prefix: 'LR-',
    fields: [
      { key: 'batchId', label: 'Batch ID', type: 'string', required: true },
      { key: 'labName', label: 'Lab Name', type: 'string', required: true },
      { key: 'verdict', label: 'Verdict', type: 'string', required: true },
      { key: 'moisture', label: 'Moisture (%)', type: 'number' },
      { key: 'hmf', label: 'HMF (mg/kg)', type: 'number' },
      { key: 'c4Sugars', label: 'C4 Sugars', type: 'string' },
    ],
    templateHeaders: ['batchId', 'labName', 'verdict', 'moisture', 'hmf', 'c4Sugars'],
    sampleRow: {
      batchId: 'HB-2026-PB-1001',
      labName: 'National Bee Board Analytical Lab',
      verdict: 'PURE',
      moisture: 17.4,
      hmf: 12.8,
      c4Sugars: 'Negative',
    },
  },
  packages: {
    label: 'Jar Packages',
    prefix: 'PACK-',
    fields: [
      { key: 'packId', label: 'Pack ID', type: 'string', required: true },
      { key: 'batchId', label: 'Batch ID', type: 'string', required: true },
      { key: 'jarSize', label: 'Jar Size', type: 'string' },
      { key: 'scanCount', label: 'Scan Count', type: 'number' },
    ],
    templateHeaders: ['packId', 'batchId', 'jarSize', 'scanCount'],
    sampleRow: {
      packId: 'HB-2026-PB-1001-P0001',
      batchId: 'HB-2026-PB-1001',
      jarSize: '500g',
      scanCount: 1,
    },
  },
  listings: {
    label: 'Marketplace Listings',
    prefix: 'LIST-',
    fields: [
      { key: 'title', label: 'Listing Title', type: 'string', required: true },
      { key: 'batchId', label: 'Batch ID', type: 'string', required: true },
      { key: 'floralSource', label: 'Floral Source', type: 'string' },
      { key: 'price', label: 'Price (₹)', type: 'number', required: true },
      { key: 'stock', label: 'Stock Jars', type: 'number', required: true },
      { key: 'state', label: 'State', type: 'string' },
    ],
    templateHeaders: ['title', 'batchId', 'floralSource', 'price', 'stock', 'state'],
    sampleRow: {
      title: 'Raw Mustard Honey (500g)',
      batchId: 'HB-2026-PB-1001',
      floralSource: 'Mustard',
      price: 499,
      stock: 50,
      state: 'Punjab',
    },
  },
  orders: {
    label: 'Orders',
    prefix: 'ORD-',
    fields: [
      { key: 'customerName', label: 'Customer Name', type: 'string', required: true },
      { key: 'totalAmount', label: 'Total (₹)', type: 'number', required: true },
      { key: 'status', label: 'Status (delivered/confirmed)', type: 'string', required: true },
      { key: 'trackingNumber', label: 'Courier Tracking', type: 'string' },
    ],
    templateHeaders: ['customerName', 'totalAmount', 'status', 'trackingNumber'],
    sampleRow: {
      customerName: 'Pooja Sharma',
      totalAmount: 998,
      status: 'delivered',
      trackingNumber: 'IN-DEL-984210',
    },
  },
  reviews: {
    label: 'Reviews',
    prefix: 'REV-',
    fields: [
      { key: 'userName', label: 'User Name', type: 'string', required: true },
      { key: 'batchId', label: 'Batch ID', type: 'string', required: true },
      { key: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
      { key: 'comment', label: 'Comment', type: 'string' },
      { key: 'verifiedPurchase', label: 'Verified Purchase (true/false)', type: 'boolean' },
    ],
    templateHeaders: ['userName', 'batchId', 'rating', 'comment', 'verifiedPurchase'],
    sampleRow: {
      userName: 'Pooja Sharma',
      batchId: 'HB-2026-PB-1001',
      rating: 5,
      comment: 'Authentic mustard taste. QR code verified on chain!',
      verifiedPurchase: true,
    },
  },
  disputes: {
    label: 'Disputes',
    prefix: 'DISP-',
    fields: [
      { key: 'orderId', label: 'Order ID', type: 'string', required: true },
      { key: 'reason', label: 'Dispute Reason', type: 'string', required: true },
      { key: 'status', label: 'Status (OPEN/REFUNDED)', type: 'string', required: true },
      { key: 'claimAmount', label: 'Claim Amount (₹)', type: 'number' },
    ],
    templateHeaders: ['orderId', 'reason', 'status', 'claimAmount'],
    sampleRow: {
      orderId: 'ORD-2026-1001',
      reason: 'Damaged Jar Seal',
      status: 'OPEN',
      claimAmount: 499,
    },
  },
};

export const AdminDataManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'crud' | 'import' | 'sample' | 'reset' | 'simulator'>('crud');
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('beekeepers');
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // CRUD Modal
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false);
  const [recordForm, setRecordForm] = useState<Record<string, any>>({});
  const [actionNotice, setActionNotice] = useState<string>('');

  // Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, any>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Sample Wizard & Reset
  const [seedingBaseline, setSeedingBaseline] = useState<boolean>(false);
  const [generatingSample, setGeneratingSample] = useState<boolean>(false);
  const [clearingSample, setClearingSample] = useState<boolean>(false);
  const [resetToken, setResetToken] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Sensor Simulator State
  const [simSerial, setSimSerial] = useState<string>('DEV-1001');
  const [simHiveId, setSimHiveId] = useState<string>('HV-1001');
  const [simTemp, setSimTemp] = useState<number>(34.5);
  const [simHumidity, setSimHumidity] = useState<number>(62.0);
  const [simWeight, setSimWeight] = useState<number>(38.5);
  const [simBattery, setSimBattery] = useState<number>(94);
  const [simAutoStream, setSimAutoStream] = useState<boolean>(false);
  const [simTickResult, setSimTickResult] = useState<string>('');

  // Fetch records on entity change
  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      const res = await fetch('/api/admin/data/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'list', entity: selectedEntity }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setRecords(data.items);
      }
    } catch (e) {
      console.error('Fetch records error:', e);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedEntity]);

  // Handle Save / Create record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operation = isCreateMode ? 'create' : 'update';
      const id = isCreateMode ? undefined : editingRecord?.id;
      const res = await fetch('/api/admin/data/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          entity: selectedEntity,
          id,
          data: recordForm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionNotice(`Record ${data.id || id} ${isCreateMode ? 'created' : 'updated'} successfully.`);
        setEditingRecord(null);
        setIsCreateMode(false);
        fetchRecords();
        setTimeout(() => setActionNotice(''), 4000);
      }
    } catch (e) {
      console.error('Save record error:', e);
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string) => {
    if (!confirm(`Are you sure you want to delete ${id}?`)) return;
    try {
      const res = await fetch('/api/admin/data/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'delete', entity: selectedEntity, id }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Record ${id} removed.`);
        setRecords((prev) => prev.filter((r) => r.id !== id));
        setTimeout(() => setActionNotice(''), 4000);
      }
    } catch (e) {
      console.error('Delete record error:', e);
    }
  };

  // CSV File Upload & Parse
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvRows(results.data as Record<string, any>[]);

        // Auto map matching keys
        const initialMap: Record<string, string> = {};
        const configFields = ENTITY_CONFIG[selectedEntity].fields;
        headers.forEach((h) => {
          const match = configFields.find((f) => f.key.toLowerCase() === h.toLowerCase().trim());
          if (match) initialMap[h] = match.key;
        });
        setColumnMap(initialMap);
      },
    });
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const def = ENTITY_CONFIG[selectedEntity];
    const csvStr = Papa.unparse({
      fields: def.templateHeaders,
      data: [def.sampleRow],
    });
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedEntity}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute CSV Import
  const handleExecuteImport = async () => {
    if (csvRows.length === 0) return;
    setIsImporting(true);

    try {
      let importedCount = 0;
      for (const row of csvRows) {
        const docPayload: Record<string, any> = {};
        Object.entries(columnMap).forEach(([csvHeader, targetField]) => {
          if (targetField && row[csvHeader] !== undefined) {
            docPayload[targetField] = row[csvHeader];
          }
        });

        await fetch('/api/admin/data/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'create',
            entity: selectedEntity,
            data: docPayload,
          }),
        });
        importedCount++;
      }

      setActionNotice(`Successfully imported ${importedCount} records into ${selectedEntity}!`);
      setCsvFile(null);
      setCsvRows([]);
      fetchRecords();
      setTimeout(() => setActionNotice(''), 5000);
    } catch (e) {
      console.error('Import error:', e);
    } finally {
      setIsImporting(false);
    }
  };

  // Seed Production Baseline
  const handleSeedBaseline = async () => {
    setSeedingBaseline(true);
    try {
      const res = await fetch('/api/admin/data/seed-baseline', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message || 'Seeded baseline collections!');
        fetchRecords();
        setTimeout(() => setActionNotice(''), 6000);
      } else {
        alert(data.error || 'Failed to seed baseline');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to seed baseline collections');
    } finally {
      setSeedingBaseline(false);
    }
  };

  // Generate Sample Data Wizard
  const handleGenerateSample = async () => {
    setGeneratingSample(true);
    try {
      const res = await fetch('/api/admin/data/generate-sample', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionNotice('Sample dataset generated! 5 Beekeepers, 5 Hives, Batches & Orders active.');
        fetchRecords();
        setTimeout(() => setActionNotice(''), 6000);
      }
    } catch (e) {
      console.error('Generate sample error:', e);
    } finally {
      setGeneratingSample(false);
    }
  };

  // Delete All Sample Data
  const handleDeleteSampleData = async () => {
    if (!confirm('Are you sure you want to delete all sample records tagged isSample: true?')) return;
    setClearingSample(true);
    try {
      const res = await fetch('/api/admin/data/clear-sample', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Cleared ${data.totalDeleted} sample documents.`);
        fetchRecords();
        setTimeout(() => setActionNotice(''), 5000);
      }
    } catch (e) {
      console.error('Clear sample error:', e);
    } finally {
      setClearingSample(false);
    }
  };

  // Confirmed Factory Reset
  const handleFactoryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetToken !== 'RESET-HONEY-CHAIN') {
      alert('You must type RESET-HONEY-CHAIN exactly to confirm reset.');
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/data/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationToken: resetToken }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice('Platform state reset completed.');
        setResetToken('');
        fetchRecords();
        setTimeout(() => setActionNotice(''), 5000);
      }
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setIsResetting(false);
    }
  };

  // Sensor Simulator Tick
  const handleSensorTick = async (injectAnomaly: boolean = false) => {
    try {
      const res = await fetch('/api/sensor-simulator/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceSerial: simSerial,
          hiveId: simHiveId,
          temperature: simTemp,
          humidity: simHumidity,
          weight: simWeight,
          battery: simBattery,
          injectAnomaly,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimTickResult(
          `Tick recorded! Temp: ${data.reading.temperature}°C, Hum: ${data.reading.humidity}%, Weight: ${data.reading.weight}kg ${
            data.alert ? '🚨 ALERT: ' + data.alert.title : '✅ Normal'
          }`
        );
      }
    } catch (e) {
      console.error('Sensor tick error:', e);
    }
  };

  // Auto-stream simulator
  useEffect(() => {
    let interval: any;
    if (simAutoStream) {
      interval = setInterval(() => {
        // slight jitter
        setSimTemp((t) => Number(((t ?? 34.5) + (Math.random() * 0.4 - 0.2)).toFixed(1)));
        setSimHumidity((h) => Number(((h ?? 62) + (Math.random() * 0.6 - 0.3)).toFixed(1)));
        handleSensorTick(false);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [simAutoStream, simTemp, simHumidity, simSerial, simHiveId, simWeight, simBattery]);

  const filteredRecords = records.filter((r) => {
    const str = JSON.stringify(r).toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Admin Data Master
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-7 h-7 text-amber-500" />
            Administrative Data Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Full entity CRUD, CSV/Excel import with mapping preview, linked sample generator, confirmed reset, and live sensor simulator.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('crud')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'crud' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            CRUD Explorer
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'import' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            CSV Import
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'sample' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sample Wizard
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'simulator' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sensor Simulator
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'reset' ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Reset
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 1: CRUD EXPLORER */}
      {activeTab === 'crud' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Entity Collection:</label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value as EntityType)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-amber-600"
              >
                {Object.keys(ENTITY_CONFIG).map((k) => (
                  <option key={k} value={k}>
                    {ENTITY_CONFIG[k as EntityType].label} ({k})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${selectedEntity}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs"
                />
              </div>

              <button
                onClick={() => {
                  setIsCreateMode(true);
                  setEditingRecord({});
                  setRecordForm({});
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5">ID</th>
                    {ENTITY_CONFIG[selectedEntity].fields.slice(0, 4).map((f) => (
                      <th key={f.key} className="p-3.5">
                        {f.label}
                      </th>
                    ))}
                    <th className="p-3.5">Sample?</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingRecords ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading records...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No records in {selectedEntity}.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          {rec.id}
                        </td>
                        {ENTITY_CONFIG[selectedEntity].fields.slice(0, 4).map((f) => (
                          <td key={f.key} className="p-3.5 text-slate-700 dark:text-slate-300">
                            {typeof rec[f.key] === 'object'
                              ? JSON.stringify(rec[f.key])
                              : String(rec[f.key] ?? '—')}
                          </td>
                        ))}
                        <td className="p-3.5">
                          {rec.isSample ? (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-bold">
                              Sample
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Real</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setIsCreateMode(false);
                              setEditingRecord(rec);
                              setRecordForm({ ...rec });
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CSV IMPORT WITH MAPPING PREVIEW */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Batch CSV & Excel Importer</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select entity, download the template, upload populated CSV, map columns, and validate records.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value as EntityType)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold"
                >
                  {Object.keys(ENTITY_CONFIG).map((k) => (
                    <option key={k} value={k}>
                      {ENTITY_CONFIG[k as EntityType].label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Get Template</span>
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <Upload className="w-8 h-8 text-amber-500 mx-auto" />
              <div>
                <label className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm">
                  Select CSV File
                  <input type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-slate-400">
                {csvFile ? `Selected: ${csvFile.name} (${csvRows.length} rows parsed)` : 'Upload CSV for automated column mapping.'}
              </p>
            </div>

            {/* Column Mapping & Validation Preview */}
            {csvRows.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Column Mapping Configuration:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {csvHeaders.map((hdr) => (
                    <div key={hdr} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        {hdr}
                      </span>
                      <span className="text-slate-400 text-xs">→</span>
                      <select
                        value={columnMap[hdr] || ''}
                        onChange={(e) => setColumnMap({ ...columnMap, [hdr]: e.target.value })}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        <option value="">Ignore column</option>
                        {ENTITY_CONFIG[selectedEntity].fields.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Preview: Ready to import {csvRows.length} records into {selectedEntity}. IDs will be automatically assigned.
                  </span>

                  <button
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
                  >
                    {isImporting ? 'Importing Rows...' : `Import ${csvRows.length} Records`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SAMPLE DATA GENERATOR WIZARD */}
      {activeTab === 'sample' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-base font-black text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5 text-emerald-500" />
              <span>Production Baseline Setup</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Initializes essential production collections: atomic sequence counters (<span className="font-mono">beekeepers</span>, <span className="font-mono">hives</span>, <span className="font-mono">batches</span>, <span className="font-mono">jars</span>), species safe thresholds, platform economics (88/12), and NABL accredited labs.
            </p>
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-300">
              Run this once when connecting a new Firebase project to ensure all counters and thresholds exist.
            </div>

            <button
              onClick={handleSeedBaseline}
              disabled={seedingBaseline}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Database className={`w-4 h-4 ${seedingBaseline ? 'animate-spin' : ''}`} />
              <span>{seedingBaseline ? 'Initializing Baseline...' : 'Initialize Production Baseline'}</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Realistic Linked Sample Dataset Wizard</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generates 5 certified beekeepers across Punjab, J&K, UP, West Bengal, and Maharashtra, 5 monitored hives with paired IoT serials, verified batches with pure lab reports and SHA-256 hashes, retail packages with verifiable QR IDs, listings, orders, and reviews.
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
              All generated records are tagged with <strong className="font-mono">isSample: true</strong> and use the exact same atomic sequence ID engine, ledger hashes, and 88/12 payout rules.
            </div>

            <button
              onClick={handleGenerateSample}
              disabled={generatingSample}
              className="w-full py-3 rounded-2xl bg-linear-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${generatingSample ? 'animate-spin' : ''}`} />
              <span>{generatingSample ? 'Populating Multi-Entity Graph...' : 'Generate Full Sample Dataset'}</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-base font-black text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>Purge Sample Data</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cleanly identifies and deletes all documents flagged with <strong className="font-mono">isSample: true</strong> across all 12 platform collections without affecting real user registrations.
            </p>

            <button
              onClick={handleDeleteSampleData}
              disabled={clearingSample}
              className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className={`w-4 h-4 ${clearingSample ? 'animate-spin' : ''}`} />
              <span>{clearingSample ? 'Clearing Sample Data...' : 'Delete All Sample Records'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SENSOR SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-500" />
                <span>Interactive IoT Brood Telemetry Simulator</span>
              </h3>
              <p className="text-xs text-slate-500">
                Transmit live sensor readings to verify real-time charts, threshold boundary triggers, and health alerts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimAutoStream(!simAutoStream)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  simAutoStream
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${simAutoStream ? 'animate-pulse' : ''}`} />
                <span>{simAutoStream ? 'Streaming Active (4s)' : 'Start Auto Stream'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Device Serial
              </label>
              <input
                type="text"
                value={simSerial}
                onChange={(e) => setSimSerial(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Target Hive ID
              </label>
              <input
                type="text"
                value={simHiveId}
                onChange={(e) => setSimHiveId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Brood Temp: <span className="text-amber-600">{simTemp}°C</span>
              </label>
              <input
                type="range"
                min="25"
                max="45"
                step="0.1"
                value={simTemp}
                onChange={(e) => setSimTemp(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Humidity: <span className="text-blue-600">{simHumidity}%</span>
              </label>
              <input
                type="range"
                min="30"
                max="90"
                step="0.5"
                value={simHumidity}
                onChange={(e) => setSimHumidity(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>

          {/* Quick Anomaly Triggers */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-400">Inject Scenarios:</span>
            <button
              onClick={() => {
                setSimTemp(39.8);
                handleSensorTick(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold hover:bg-red-500/20 transition"
            >
              🔥 Overheating Anomaly (&gt;39°C)
            </button>
            <button
              onClick={() => {
                setSimHumidity(42.0);
                handleSensorTick(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold hover:bg-amber-500/20 transition"
            >
              💧 Dry Brood Anomaly (&lt;45%)
            </button>
            <button
              onClick={() => {
                setSimWeight(28.0);
                handleSensorTick(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 text-xs font-bold hover:bg-purple-500/20 transition"
            >
              🐝 Swarm Event (Sudden -10kg Drop)
            </button>
            <button
              onClick={() => handleSensorTick(false)}
              className="ml-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition"
            >
              Send Single Reading
            </button>
          </div>

          {simTickResult && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300">
              {simTickResult}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CONFIRMED PLATFORM RESET */}
      {activeTab === 'reset' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900/40 shadow-sm space-y-4 max-w-xl mx-auto">
          <div className="flex items-center gap-2 text-base font-black text-red-600">
            <ShieldAlert className="w-6 h-6" />
            <span>Factory Demo Reset</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Destructive reset clears all simulated orders, marketplace carts, reviews, test disputes, and transient telemetry. Does not delete core master beekeeper accounts.
          </p>

          <form onSubmit={handleFactoryReset} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Type <strong className="font-mono text-red-600">RESET-HONEY-CHAIN</strong> to confirm:
              </label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="RESET-HONEY-CHAIN"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-red-300 dark:border-red-900 text-xs font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={resetToken !== 'RESET-HONEY-CHAIN' || isResetting}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isResetting ? 'Purging Platform State...' : 'Confirm Factory Reset'}
            </button>
          </form>
        </div>
      )}

      {/* Record Edit / Create Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isCreateMode ? `Add New ${ENTITY_CONFIG[selectedEntity].label}` : `Edit ${editingRecord.id}`}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ENTITY_CONFIG[selectedEntity].fields.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={recordForm[f.key] ?? ''}
                      onChange={(e) =>
                        setRecordForm({
                          ...recordForm,
                          [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                        })
                      }
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition"
                >
                  {isCreateMode ? 'Create Record' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
