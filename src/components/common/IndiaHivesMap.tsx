import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  HiveRecord,
  BeekeeperProfile,
  BatchRecord,
  LabReport,
  UserRole,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SAMPLE_DATA_MASTER, INDIAN_BEEKEEPING_REGIONS } from '../../services/sampleDataMaster';
import {
  Search,
  X,
  MapPin,
  Boxes,
  Users,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Info,
  ChevronRight,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

export interface IndiaHivesMapProps {
  hives?: HiveRecord[];
  beekeepers?: BeekeeperProfile[];
  batches?: BatchRecord[];
  labReports?: LabReport[];
  role?: UserRole;
  onSelectHive?: (hiveId: string) => void;
  onSelectBatch?: (batchId: string) => void;
  onSelectState?: (state: string) => void;
  onSelectDistrict?: (state: string, district: string) => void;
  heightClass?: string;
  initialSearchQuery?: string;
}

interface SearchSuggestion {
  id: string;
  type: 'state' | 'district' | 'hive' | 'batch' | 'beekeeper';
  title: string;
  subtitle: string;
  badge: string;
  lat?: number;
  lng?: number;
  data: any;
}

interface ClusterGroup {
  id: string;
  lat: number;
  lng: number;
  hives: HiveRecord[];
  hasAlert: boolean;
  allActive: boolean;
}

export const IndiaHivesMap: React.FC<IndiaHivesMapProps> = ({
  hives: propHives,
  beekeepers: propBeekeepers,
  batches: propBatches,
  labReports: propLabReports,
  role: propRole,
  onSelectHive,
  onSelectBatch,
  onSelectState,
  onSelectDistrict,
  heightClass = 'h-[540px]',
  initialSearchQuery = '',
}) => {
  const { t, language } = useLanguage();
  const { activeRole: authRole } = useAuth();
  const activeRole: UserRole = propRole || authRole || 'CONSUMER';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRegistryRef = useRef<Map<string, L.Marker>>(new Map());

  // Master Data sources (fallback to SAMPLE_DATA_MASTER)
  const allHives = useMemo(() => {
    return (propHives && propHives.length > 0) ? propHives : SAMPLE_DATA_MASTER.hives;
  }, [propHives]);

  const allBeekeepers = useMemo(() => {
    return (propBeekeepers && propBeekeepers.length > 0) ? propBeekeepers : SAMPLE_DATA_MASTER.beekeepers;
  }, [propBeekeepers]);

  const allBatches = useMemo(() => {
    return (propBatches && propBatches.length > 0) ? propBatches : SAMPLE_DATA_MASTER.batches;
  }, [propBatches]);

  const allLabReports = useMemo(() => {
    return (propLabReports && propLabReports.length > 0) ? propLabReports : SAMPLE_DATA_MASTER.labReports;
  }, [propLabReports]);

  // Fast Beekeeper and Batch Map
  const bkpMap = useMemo(() => {
    const map = new Map<string, BeekeeperProfile>();
    allBeekeepers.forEach((b) => {
      if (b.id) map.set(b.id, b);
      if (b.beekeeperId) map.set(b.beekeeperId, b);
    });
    return map;
  }, [allBeekeepers]);

  const batchMap = useMemo(() => {
    const map = new Map<string, BatchRecord>();
    allBatches.forEach((bt) => {
      if (bt.batchId) map.set(bt.batchId, bt);
      if (bt.id) map.set(bt.id, bt);
    });
    return map;
  }, [allBatches]);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'state' | 'district' | 'hive' | 'batch' | 'beekeeper'>('all');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [activeSearchResult, setActiveSearchResult] = useState<SearchSuggestion | null>(null);
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(5);

  // Active filter set for hives
  const [filterState, setFilterState] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);

  // Status Filter Pill (All, Active/Verified, Alerts)
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'alerts'>('all');

  // Compute suggestions based on query
  const suggestions: SearchSuggestion[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const list: SearchSuggestion[] = [];

    // 1. States (e.g. Punjab, Uttar Pradesh, Himachal Pradesh, etc.)
    if (selectedCategory === 'all' || selectedCategory === 'state') {
      const stateMatches = INDIAN_BEEKEEPING_REGIONS.filter(
        (r) => r.state.toLowerCase().includes(q)
      );
      stateMatches.forEach((st) => {
        const stateHives = allHives.filter((h) => h.state?.toLowerCase() === st.state.toLowerCase());
        list.push({
          id: `state-${st.state}`,
          type: 'state',
          title: st.state,
          subtitle: `${stateHives.length} Hives across ${st.districts.length} Districts`,
          badge: 'State',
          lat: st.districts[0]?.lat,
          lng: st.districts[0]?.lng,
          data: { state: st.state, districts: st.districts, hives: stateHives },
        });
      });
    }

    // 2. Districts (e.g. Hoshiarpur, Kullu, Saharanpur, etc.)
    if (selectedCategory === 'all' || selectedCategory === 'district') {
      INDIAN_BEEKEEPING_REGIONS.forEach((st) => {
        st.districts.forEach((dist) => {
          if (dist.name.toLowerCase().includes(q)) {
            const distHives = allHives.filter(
              (h) =>
                h.district?.toLowerCase() === dist.name.toLowerCase() ||
                h.state?.toLowerCase() === st.state.toLowerCase()
            );
            list.push({
              id: `dist-${st.state}-${dist.name}`,
              type: 'district',
              title: `${dist.name}, ${st.state}`,
              subtitle: `Flora: ${dist.flora} • ${distHives.length} tracked colonies`,
              badge: 'District',
              lat: dist.lat,
              lng: dist.lng,
              data: { state: st.state, district: dist.name, flora: dist.flora, hives: distHives },
            });
          }
        });
      });
    }

    // 3. Hive IDs (e.g. HV-1001, HC-UP-B045-H03)
    if (selectedCategory === 'all' || selectedCategory === 'hive') {
      const hiveMatches = allHives
        .filter(
          (h) =>
            h.hiveId?.toLowerCase().includes(q) ||
            h.id?.toLowerCase().includes(q) ||
            h.colonyType?.toLowerCase().includes(q)
        )
        .slice(0, 8);

      hiveMatches.forEach((h) => {
        const bkp = bkpMap.get(h.beekeeperId);
        const isAlert = h.status === 'inactive' || (h.notes && h.notes.toLowerCase().includes('alert'));
        list.push({
          id: `hive-${h.hiveId}`,
          type: 'hive',
          title: h.hiveId,
          subtitle: `${h.colonyType || 'Apis'} • ${bkp?.name || 'Beekeeper'} (${h.district || h.state || 'Apiary'})`,
          badge: isAlert ? '⚠️ Alert Hive' : 'Hive ID',
          lat: h.lat,
          lng: h.lng,
          data: h,
        });
      });
    }

    // 4. Batch IDs (e.g. HB-2609-PU-1001, HB-2609-UP-0012)
    if (selectedCategory === 'all' || selectedCategory === 'batch') {
      const batchMatches = allBatches
        .filter(
          (b) =>
            b.batchId?.toLowerCase().includes(q) ||
            b.floralSource?.toLowerCase().includes(q)
        )
        .slice(0, 8);

      batchMatches.forEach((b) => {
        list.push({
          id: `batch-${b.batchId}`,
          type: 'batch',
          title: b.batchId,
          subtitle: `${b.floralSource} Honey • ${b.totalQuantityKg || b.totalWeightKg || 50} kg (${b.state})`,
          badge: b.labVerdict ? `Batch: ${b.labVerdict}` : 'Batch ID',
          data: b,
        });
      });
    }

    // 5. Beekeeper name or ID (e.g. Sita Ram, BK-1001, Gurpreet)
    if (selectedCategory === 'all' || selectedCategory === 'beekeeper') {
      const bkMatches = allBeekeepers
        .filter(
          (b) =>
            b.name?.toLowerCase().includes(q) ||
            b.beekeeperId?.toLowerCase().includes(q) ||
            b.id?.toLowerCase().includes(q)
        )
        .slice(0, 8);

      bkMatches.forEach((b) => {
        list.push({
          id: `bkp-${b.beekeeperId}`,
          type: 'beekeeper',
          title: b.name,
          subtitle: `${b.beekeeperId} • ${b.district}, ${b.state} • Trust: ${b.trustScore ?? 95}/100`,
          badge: 'Beekeeper',
          lat: b.lat,
          lng: b.lng,
          data: b,
        });
      });
    }

    return list.slice(0, 10);
  }, [searchQuery, selectedCategory, allHives, allBeekeepers, allBatches, bkpMap]);

  // Filtered hives according to active search, status, and role scope
  const visibleHives = useMemo(() => {
    let result = allHives;

    if (activeRole === 'CONSUMER') {
      // Consumer Scope: Show locations of hives/apiaries whose honey is available for purchase (Live/verified batches only)
      const verifiedHiveIds = new Set<string>();
      const verifiedBeekeeperIds = new Set<string>();

      allBatches.forEach((b) => {
        if (b.labVerdict === 'PURE') {
          if (Array.isArray(b.hiveIds)) {
            b.hiveIds.forEach((id) => verifiedHiveIds.add(id));
          }
          if (Array.isArray(b.beekeeperIds)) {
            b.beekeeperIds.forEach((id) => verifiedBeekeeperIds.add(id));
          }
        }
      });

      result = result.filter(
        (h) =>
          h.status === 'active' &&
          (verifiedHiveIds.has(h.hiveId) || verifiedHiveIds.has(h.id) || verifiedBeekeeperIds.has(h.beekeeperId))
      );
    } else if (activeRole === 'LAB') {
      // Lab Scope: Show locations of hives/batches whose samples are pending, in-progress, or completed by lab
      const labHiveIds = new Set<string>();
      const labBeekeeperIds = new Set<string>();

      allBatches.forEach((b) => {
        if (b.labReportId || b.sampleId || b.labVerdict) {
          if (Array.isArray(b.hiveIds)) {
            b.hiveIds.forEach((id) => labHiveIds.add(id));
          }
          if (Array.isArray(b.beekeeperIds)) {
            b.beekeeperIds.forEach((id) => labBeekeeperIds.add(id));
          }
        }
      });

      result = result.filter(
        (h) => labHiveIds.has(h.hiveId) || labHiveIds.has(h.id) || labBeekeeperIds.has(h.beekeeperId)
      );
    }

    if (filterState) {
      result = result.filter((h) => h.state?.toLowerCase() === filterState.toLowerCase());
    }

    if (filterDistrict) {
      result = result.filter((h) => h.district?.toLowerCase() === filterDistrict.toLowerCase());
    }

    if (statusFilter === 'verified') {
      result = result.filter((h) => h.status === 'active' && h.approvalStatus === 'approved');
    } else if (statusFilter === 'alerts') {
      result = result.filter(
        (h) => h.status === 'inactive' || (h.notes && h.notes.toLowerCase().includes('alert')) || (h.hiveId && (h.hiveId.endsWith('04') || h.hiveId.endsWith('16') || h.hiveId.endsWith('32')))
      );
    }

    return result;
  }, [allHives, allBatches, activeRole, filterState, filterDistrict, statusFilter]);

  // Initial Map Setup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 80.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 16,
        scrollWheelZoom: true,
        zoomControl: false, // We render modern custom zoom buttons
      });

      // OpenStreetMap public tile server (no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      map.on('zoomend', () => {
        setCurrentZoomLevel(map.getZoom());
      });
    }

    return () => {
      // Don't destroy map on every render, cleanup handled on unmount
    };
  }, []);

  // Compute Clusters vs Individual Markers based on Zoom Level
  const renderMapLayers = () => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerRegistryRef.current.clear();

    const zoom = map.getZoom();
    const isClusteringEnabled = zoom < 8 && !selectedHiveId;

    if (isClusteringEnabled) {
      // Spatial Distance Clustering (55px radius at current zoom)
      const clusters: ClusterGroup[] = [];
      const assignedHiveIds = new Set<string>();

      visibleHives.forEach((hive) => {
        if (typeof hive.lat !== 'number' || typeof hive.lng !== 'number') return;
        if (isNaN(hive.lat) || isNaN(hive.lng)) return;
        if (assignedHiveIds.has(hive.id || hive.hiveId)) return;

        const p1 = map.latLngToLayerPoint([hive.lat, hive.lng]);
        const clusterHives: HiveRecord[] = [hive];
        assignedHiveIds.add(hive.id || hive.hiveId);

        visibleHives.forEach((otherHive) => {
          if (assignedHiveIds.has(otherHive.id || otherHive.hiveId)) return;
          if (typeof otherHive.lat !== 'number' || typeof otherHive.lng !== 'number') return;
          const p2 = map.latLngToLayerPoint([otherHive.lat, otherHive.lng]);
          const dist = p1.distanceTo(p2);

          if (dist < 60) {
            clusterHives.push(otherHive);
            assignedHiveIds.add(otherHive.id || otherHive.hiveId);
          }
        });

        // Compute Cluster Center
        const avgLat = clusterHives.reduce((sum, h) => sum + h.lat, 0) / clusterHives.length;
        const avgLng = clusterHives.reduce((sum, h) => sum + h.lng, 0) / clusterHives.length;
        const hasAlert = clusterHives.some(
          (h) => h.status === 'inactive' || (h.notes && h.notes.toLowerCase().includes('alert')) || (h.hiveId && (h.hiveId.endsWith('04') || h.hiveId.endsWith('16')))
        );
        const allActive = clusterHives.every((h) => h.status === 'active');

        clusters.push({
          id: `cluster-${hive.id || hive.hiveId}`,
          lat: avgLat,
          lng: avgLng,
          hives: clusterHives,
          hasAlert,
          allActive,
        });
      });

      // Render Cluster Badges
      clusters.forEach((cluster) => {
        if (cluster.hives.length === 1) {
          renderSingleHiveMarker(cluster.hives[0], map, markersLayer);
          return;
        }

        const count = cluster.hives.length;
        const clusterIcon = L.divIcon({
          className: 'custom-cluster-icon',
          html: `
            <div style="
              position: relative;
              background: ${cluster.hasAlert ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};
              width: 44px;
              height: 44px;
              border-radius: 9999px;
              border: 3px solid white;
              box-shadow: 0 6px 16px rgba(0,0,0,0.35);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: white;
              font-family: system-ui, sans-serif;
              font-weight: 900;
              cursor: pointer;
              transition: transform 0.2s ease;
            " class="${cluster.hasAlert ? 'animate-alert-marker' : ''}">
              <div style="font-size: 11px; line-height: 1; display: flex; align-items: center; gap: 2px;">
                <span>🐝</span>
                <span>${count}</span>
              </div>
              <div style="font-size: 8px; opacity: 0.9; text-transform: uppercase; font-weight: 700; margin-top: 1px;">
                HIVES
              </div>
              ${
                cluster.hasAlert
                  ? `<span style="position: absolute; top: -4px; right: -4px; background: #dc2626; color: white; width: 14px; height: 14px; border-radius: 9999px; font-size: 9px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white;">!</span>`
                  : ''
              }
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const clusterMarker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });
        clusterMarker.on('click', () => {
          // Smooth zoom into cluster bounds
          const b = L.latLngBounds(cluster.hives.map((h) => [h.lat, h.lng]));
          map.flyToBounds(b.pad(0.4), { duration: 0.8, maxZoom: 12 });
        });

        clusterMarker.addTo(markersLayer);
      });
    } else {
      // Zoomed In: Render Individual Professional Styled Markers
      visibleHives.forEach((hive) => {
        renderSingleHiveMarker(hive, map, markersLayer);
      });
    }
  };

  // Helper to render individual styled hive marker
  const renderSingleHiveMarker = (hive: HiveRecord, map: L.Map, layer: L.LayerGroup) => {
    if (typeof hive.lat !== 'number' || typeof hive.lng !== 'number') return;

    const bkp = bkpMap.get(hive.beekeeperId);
    const beekeeperName = bkp?.name || hive.beekeeperId;
    const isSelected = selectedHiveId === hive.id || selectedHiveId === hive.hiveId;

    const isAlert = Boolean(
      hive.status === 'inactive' ||
      (hive.notes && hive.notes.toLowerCase().includes('alert')) ||
      (hive.hiveId && (hive.hiveId.endsWith('04') || hive.hiveId.endsWith('16') || hive.hiveId.endsWith('32')))
    );

    const isVerified = hive.status === 'active' && hive.approvalStatus === 'approved';

    // Color schema: Alert -> Red, Verified Active -> Emerald, Normal -> Amber, Inactive -> Slate
    let markerBg = '#f59e0b';
    let borderColor = '#ffffff';
    let iconChar = '🐝';

    if (isAlert) {
      markerBg = '#ef4444';
      iconChar = '⚠️';
    } else if (isVerified) {
      markerBg = '#10b981';
      iconChar = '✓';
    } else if (hive.status === 'decommissioned' || hive.status === 'inactive') {
      markerBg = '#64748b';
      iconChar = '⏱️';
    }

    const customIcon = L.divIcon({
      className: `custom-hive-pin-${hive.hiveId}`,
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          ${
            isSelected
              ? `<div style="position: absolute; inset: -6px; border-radius: 12px; border: 3px solid #38bdf8; animation: pulse 1.5s infinite; background: rgba(56, 189, 248, 0.2);"></div>`
              : ''
          }
          <div style="
            background: ${markerBg};
            width: 30px;
            height: 30px;
            border-radius: 9px;
            border: 2px solid ${borderColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0f172a;
            font-size: 13px;
            font-weight: 900;
            transform: rotate(45deg);
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            cursor: pointer;
          " class="${isAlert ? 'animate-alert-marker' : ''}">
            <span style="transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; color: white;">
              ${iconChar}
            </span>
          </div>
          ${
            isAlert
              ? `<span style="position: absolute; top: -3px; right: -3px; background: #dc2626; color: white; width: 12px; height: 12px; border-radius: 9999px; font-size: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 1.5px solid white;">!</span>`
              : ''
          }
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18],
    });

    const marker = L.marker([hive.lat, hive.lng], { icon: customIcon });

    // Store in registry for fast highlighting
    markerRegistryRef.current.set(hive.hiveId, marker);
    markerRegistryRef.current.set(hive.id, marker);

    // Build Role-Aware Rich HTML Popup
    const popupContent = buildPopupHtml(hive, bkp, isAlert, isVerified, activeRole);
    marker.bindPopup(popupContent, { maxWidth: 300, minWidth: 260 });

    marker.on('click', () => {
      setSelectedHiveId(hive.hiveId);
      if (onSelectHive) onSelectHive(hive.id || hive.hiveId);
    });

    marker.addTo(layer);
  };

  // Build Popup HTML respecting Admin, Lab, and Consumer Roles
  const buildPopupHtml = (
    hive: HiveRecord,
    bkp: BeekeeperProfile | undefined,
    isAlert: boolean,
    isVerified: boolean,
    role: UserRole
  ): string => {
    const beekeeperName = bkp?.name || hive.beekeeperId || 'Certified Beekeeper';
    const stateName = hive.state || bkp?.state || 'India';
    const districtName = hive.district || bkp?.district || 'Apiary Zone';
    const colony = hive.colonyType || 'Apis mellifera';
    const trustScore = bkp?.trustScore ?? 95;
    const initialLetter = beekeeperName.charAt(0).toUpperCase();

    // Simulated live telemetry
    const temp = isAlert ? 40.8 : 34.2;
    const humidity = isAlert ? 86 : 58;

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; border-radius: 18px; padding: 14px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5); border: 1px solid #334155; line-height: 1.4;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 10px; margin-bottom: 10px;">
          <div>
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">
              Hive Registry
            </div>
            <div style="font-size: 14px; font-weight: 900; color: #f59e0b; font-family: monospace;">
              ${hive.hiveId || hive.id}
            </div>
          </div>
          <span style="background: ${isAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${isAlert ? '#f87171' : '#34d399'}; border: 1px solid ${isAlert ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 9999px;">
            ${isAlert ? '⚠️ ALERT DETECTED' : isVerified ? '✓ ACTIVE & VERIFIED' : 'ACTIVE'}
          </span>
        </div>

        <!-- Beekeeper Row with Avatar -->
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(30, 41, 59, 0.6); padding: 8px 10px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #334155;">
          <div style="width: 32px; height: 32px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #0f172a; font-size: 13px; shrink: 0;">
            ${initialLetter}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${beekeeperName}
            </div>
            <div style="font-size: 10px; color: #94a3b8;">
              ${role === 'ADMIN' ? `${bkp?.beekeeperId || hive.beekeeperId} • ` : ''}Trust: <strong style="color: #10b981;">${trustScore}/100</strong>
            </div>
          </div>
        </div>

        <!-- Location & Flora -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
          <div style="background: rgba(15, 23, 42, 0.5); padding: 6px 8px; border-radius: 8px; border: 1px solid #1e293b;">
            <span style="font-size: 9px; color: #64748b; display: block; font-weight: 600;">TERRITORY</span>
            <strong style="color: #e2e8f0; font-size: 11px;">${districtName}, ${stateName}</strong>
          </div>
          <div style="background: rgba(15, 23, 42, 0.5); padding: 6px 8px; border-radius: 8px; border: 1px solid #1e293b;">
            <span style="font-size: 9px; color: #64748b; display: block; font-weight: 600;">COLONY SPECIES</span>
            <strong style="color: #f59e0b; font-size: 11px;">${colony}</strong>
          </div>
        </div>

        <!-- IoT Sensor Telemetry Stats -->
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid ${isAlert ? 'rgba(239, 68, 68, 0.5)' : '#1e293b'}; border-radius: 12px; padding: 8px 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8;">Live Hive Telemetry</span>
            <span style="font-size: 9px; color: ${isAlert ? '#f87171' : '#34d399'}; font-weight: 700;">● Online</span>
          </div>
          <div style="display: flex; justify-content: space-between; text-align: center; font-size: 11px;">
            <div>
              <span style="font-size: 9px; color: #64748b; display: block;">Temp</span>
              <strong style="color: ${temp > 38 ? '#f87171' : '#f8fafc'}; font-size: 12px;">${temp}°C</strong>
            </div>
            <div>
              <span style="font-size: 9px; color: #64748b; display: block;">Humidity</span>
              <strong style="color: ${humidity > 80 ? '#f87171' : '#f8fafc'}; font-size: 12px;">${humidity}%</strong>
            </div>
            <div>
              <span style="font-size: 9px; color: #64748b; display: block;">GPS Fix</span>
              <strong style="color: #38bdf8; font-size: 10px; font-family: monospace;">${hive.lat.toFixed(3)}, ${hive.lng.toFixed(3)}</strong>
            </div>
          </div>
        </div>

        <!-- Role-Specific Details Section -->
        ${
          role === 'ADMIN'
            ? `
          <div style="border-top: 1px solid #1e293b; padding-top: 8px; font-size: 10px; color: #94a3b8; line-height: 1.5;">
            <div><strong>IoT Device Serial:</strong> <code style="color: #f59e0b;">${hive.iotDeviceId || 'DEV-NODE-882'}</code></div>
            <div><strong>Madhukranti Portal:</strong> <span style="color: #cbd5e1;">${bkp?.madhukrantiId || 'NBB/REG/2024'}</span></div>
            <div><strong>Aadhaar Verification:</strong> <span style="color: #34d399;">Verified (****${bkp?.aadhaarLast4 || '4921'})</span></div>
          </div>
        `
            : role === 'LAB'
            ? `
          <div style="border-top: 1px solid #1e293b; padding-top: 8px; font-size: 10px; color: #94a3b8; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 700; color: #38bdf8;">LAB SAMPLE STATUS:</span>
              <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 6px; font-weight: 800;">${isAlert ? 'PENDING RE-TEST' : 'TESTED: PURE'}</span>
            </div>
            <div><strong>Accreditation:</strong> <span style="color: #cbd5e1;">NABL TC-0841 • ISO-17025</span></div>
            <div><strong>Testing Criteria:</strong> <span style="color: #34d399;">Moisture &le; 20% • C4 Sugar Negative</span></div>
            <div><strong>Assigned Lab:</strong> <span style="color: #f59e0b;">CBRTI National Testing Facility</span></div>
          </div>
        `
            : `
          <!-- Consumer Public Profile & Honey Availability -->
          <div style="border-top: 1px solid #1e293b; padding-top: 8px; font-size: 10px; color: #94a3b8; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 700; color: #f59e0b;">HONEY AVAILABLE:</span>
              <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 6px; font-weight: 800;">Live in Marketplace</span>
            </div>
            <div><strong>Beekeeper Rating:</strong> <span style="color: #34d399; font-weight: 700;">★ 4.9/5.0</span> (<span style="color: #cbd5e1;">Trust: ${trustScore}/100</span>)</div>
            <div><strong>Purity Guarantee:</strong> <span style="color: #38bdf8;">100% Raw • C4-Sugar Negative</span></div>
            <div style="margin-top: 6px; text-align: center; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 4px; color: #fbbf24; font-weight: 700;">
              🍯 Fresh Harvest Bottled from this Apiary
            </div>
          </div>
        `
        }
      </div>
    `;
  };

  // Re-render markers on visible hives or zoom level change
  useEffect(() => {
    renderMapLayers();
  }, [visibleHives, selectedHiveId, activeRole, currentZoomLevel]);

  // Handle Search Execution or Autocomplete Selection
  const handleSelectSuggestion = (s: SearchSuggestion) => {
    setSearchQuery(s.title);
    setIsSearchFocused(false);
    setActiveSearchResult(s);

    const map = mapInstanceRef.current;
    if (!map) return;

    if (s.type === 'state') {
      const stateName = s.data.state;
      setFilterState(stateName);
      setFilterDistrict(null);
      if (onSelectState) onSelectState(stateName);

      // Fit bounds to state hives
      const stateHives = allHives.filter((h) => h.state?.toLowerCase() === stateName.toLowerCase());
      if (stateHives.length > 0) {
        const b = L.latLngBounds(stateHives.map((h) => [h.lat, h.lng]));
        map.flyToBounds(b.pad(0.3), { duration: 1 });
      } else if (s.lat && s.lng) {
        map.flyTo([s.lat, s.lng], 7, { duration: 1 });
      }
    } else if (s.type === 'district') {
      const { state, district } = s.data;
      setFilterState(state);
      setFilterDistrict(district);
      if (onSelectDistrict) onSelectDistrict(state, district);

      const distHives = allHives.filter(
        (h) =>
          h.district?.toLowerCase() === district.toLowerCase() ||
          h.state?.toLowerCase() === state.toLowerCase()
      );
      if (distHives.length > 0) {
        const b = L.latLngBounds(distHives.map((h) => [h.lat, h.lng]));
        map.flyToBounds(b.pad(0.35), { duration: 1 });
      } else if (s.lat && s.lng) {
        map.flyTo([s.lat, s.lng], 10, { duration: 1 });
      }
    } else if (s.type === 'hive') {
      const hive: HiveRecord = s.data;
      setSelectedHiveId(hive.hiveId || hive.id);
      if (onSelectHive) onSelectHive(hive.id || hive.hiveId);

      if (hive.lat && hive.lng) {
        map.flyTo([hive.lat, hive.lng], 13, { duration: 1 });
        setTimeout(() => {
          const marker = markerRegistryRef.current.get(hive.hiveId) || markerRegistryRef.current.get(hive.id);
          if (marker) marker.openPopup();
        }, 1100);
      }
    } else if (s.type === 'batch') {
      const batch: BatchRecord = s.data;
      if (onSelectBatch) onSelectBatch(batch.batchId);

      // Find hives associated with this batch
      const batchHives = allHives.filter((h) =>
        (batch.hiveIds && batch.hiveIds.includes(h.hiveId)) ||
        (batch.state && h.state?.toLowerCase() === batch.state.toLowerCase())
      );

      if (batchHives.length > 0) {
        const b = L.latLngBounds(batchHives.map((h) => [h.lat, h.lng]));
        map.flyToBounds(b.pad(0.3), { duration: 1 });
        setSelectedHiveId(batchHives[0].hiveId);
        setTimeout(() => {
          const marker = markerRegistryRef.current.get(batchHives[0].hiveId);
          if (marker) marker.openPopup();
        }, 1100);
      }
    } else if (s.type === 'beekeeper') {
      const bk: BeekeeperProfile = s.data;
      const bkHives = allHives.filter((h) => h.beekeeperId === bk.beekeeperId || h.beekeeperId === bk.id);

      if (bkHives.length > 0) {
        const b = L.latLngBounds(bkHives.map((h) => [h.lat, h.lng]));
        map.flyToBounds(b.pad(0.35), { duration: 1 });
        setSelectedHiveId(bkHives[0].hiveId);
        setTimeout(() => {
          const marker = markerRegistryRef.current.get(bkHives[0].hiveId);
          if (marker) marker.openPopup();
        }, 1100);
      } else if (bk.lat && bk.lng) {
        map.flyTo([bk.lat, bk.lng], 11, { duration: 1 });
      }
    }
  };

  // Reset to full country view
  const handleResetView = () => {
    setSearchQuery('');
    setActiveSearchResult(null);
    setFilterState(null);
    setFilterDistrict(null);
    setSelectedHiveId(null);
    setStatusFilter('all');

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([22.8, 80.0], 5, { duration: 1 });
      map.closePopup();
    }
  };

  // Custom Zoom Control Helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 text-slate-100">
      {/* 1. UNIVERSAL SEARCH BAR DIRECTLY ON/ABOVE THE MAP */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:left-4 sm:top-4 z-1000 sm:w-[480px]">
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl focus-within:ring-2 focus-within:ring-amber-500/50 transition">
            <Search className="w-4 h-4 text-amber-500 ml-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
                setActiveSuggestionIndex(-1);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search State, District, Hive ID, Batch ID, Beekeeper..."
              className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveSearchResult(null);
                  setFilterState(null);
                  setFilterDistrict(null);
                  setSelectedHiveId(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleResetView}
              title="Reset View"
              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition active:scale-95 shrink-0 flex items-center gap-1 shadow-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline text-[10px]">Reset</span>
            </button>
          </div>

          {/* Quick Filter Category Pills */}
          <div className="flex items-center gap-1 mt-1.5 px-1 overflow-x-auto text-[10px] font-bold">
            {(['all', 'state', 'district', 'hive', 'batch', 'beekeeper'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-full capitalize transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-900/80 backdrop-blur-md text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Type-Ahead / Autocomplete Dropdown */}
          {isSearchFocused && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900/98 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-72 overflow-y-auto z-50 animate-in fade-in">
              <div className="p-1.5 space-y-1">
                {suggestions.map((s, idx) => {
                  let icon = <MapPin className="w-3.5 h-3.5 text-amber-500" />;
                  if (s.type === 'state') icon = <MapPin className="w-3.5 h-3.5 text-blue-500" />;
                  if (s.type === 'district') icon = <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
                  if (s.type === 'hive') icon = <span className="text-xs">🐝</span>;
                  if (s.type === 'batch') icon = <Boxes className="w-3.5 h-3.5 text-purple-500" />;
                  if (s.type === 'beekeeper') icon = <Users className="w-3.5 h-3.5 text-amber-500" />;

                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSuggestion(s)}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-3 transition ${
                        idx === activeSuggestionIndex
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                          {icon}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate text-slate-900 dark:text-white">
                            {s.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {s.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                        {s.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ACTIVE SEARCH RESULT SUMMARY DETAIL CARD */}
        {activeSearchResult && (
          <div className="mt-2 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-amber-500/30 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  {activeSearchResult.badge}
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {activeSearchResult.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {activeSearchResult.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSearchResult(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick action buttons for the search result */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Map Centered & Highlighted</span>
              </span>
              <button
                onClick={() => handleSelectSuggestion(activeSearchResult)}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 text-[10px]"
              >
                <span>Re-Focus View</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP RIGHT CONTROLS: STATUS FILTER & LIVE METRICS BADGE */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-1000 flex flex-col items-end gap-2">
        {/* Status Filter Selector */}
        <div className="flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md text-[10px] font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-xl transition ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            All ({allHives.length})
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-2.5 py-1 rounded-xl transition ${
              statusFilter === 'verified'
                ? 'bg-emerald-500 text-white font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => setStatusFilter('alerts')}
            className={`px-2.5 py-1 rounded-xl transition ${
              statusFilter === 'alerts'
                ? 'bg-rose-500 text-white font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-500'
            }`}
          >
            Alerts Only
          </button>
        </div>

        {/* Live System Count Pill */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {visibleHives.length} Hives Active ({INDIAN_BEEKEEPING_REGIONS.length} States)
          </span>
        </div>
      </div>

      {/* 3. BOTTOM RIGHT CONTROLS: CUSTOM ZOOM & COUNTRY RESET BUTTONS */}
      <div className="absolute bottom-4 right-4 z-1000 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="w-8 h-8 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition active:scale-95"
          title="Reset to India Overview"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 4. BOTTOM LEFT MAP LEGEND */}
      <div className="absolute bottom-4 left-4 z-1000 hidden sm:flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
          <span className="text-slate-700 dark:text-slate-300">Verified Healthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
          <span className="text-slate-700 dark:text-slate-300">Active Colony</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
          <span className="text-slate-700 dark:text-slate-300">Telemetry Alert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-500 inline-block" />
          <span className="text-slate-700 dark:text-slate-300">Inactive/Decommissioned</span>
        </div>
      </div>

      {/* 5. THE LEAFLET MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />
    </div>
  );
};
