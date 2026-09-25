import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HiveRecord, BeekeeperProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';

interface IndiaHivesMapProps {
  hives: HiveRecord[];
  beekeepers?: BeekeeperProfile[];
  onSelectHive?: (hiveId: string) => void;
  heightClass?: string;
}

export const IndiaHivesMap: React.FC<IndiaHivesMapProps> = ({
  hives,
  beekeepers = [],
  onSelectHive,
  heightClass = 'h-[420px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map centered on India if not already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 80.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 14,
        scrollWheelZoom: false,
      });

      // CartoDB Voyager tiles (clean, neutral, clear Indian regional labels)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const activeHives = (hives && hives.length > 0) ? hives : SAMPLE_DATA_MASTER.hives;
    const activeBeekeepers = (beekeepers && beekeepers.length > 0) ? beekeepers : SAMPLE_DATA_MASTER.beekeepers;

    // Map beekeeper map for fast lookup
    const bkpMap = new Map<string, BeekeeperProfile>();
    activeBeekeepers.forEach((b) => bkpMap.set(b.id || b.beekeeperId || '', b));

    const bounds = L.latLngBounds([]);

    activeHives.forEach((hive) => {
      if (typeof hive.lat !== 'number' || typeof hive.lng !== 'number') return;
      if (isNaN(hive.lat) || isNaN(hive.lng)) return;

      const latLng = L.latLng(hive.lat, hive.lng);
      bounds.extend(latLng);

      const bkp = bkpMap.get(hive.beekeeperId);
      const beekeeperName = bkp?.name || hive.beekeeperId;
      const stateName = bkp?.state || hive.area?.split(',')[1]?.trim() || '';

      // Create distinctive hexagonal honey icon using CSS
      const isAlert = hive.status === 'inactive' || (hive.notes && hive.notes.toLowerCase().includes('alert'));
      const markerColor = isAlert ? '#ef4444' : '#f59e0b';

      const customIcon = L.divIcon({
        className: 'custom-hive-marker',
        html: `
          <div style="
            background: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 8px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0f172a;
            font-size: 13px;
            font-weight: 900;
            transform: rotate(45deg);
            transition: transform 0.2s ease;
          ">
            <span style="transform: rotate(-45deg);">🐝</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="color: #0f172a; font-size: 13px;">${hive.hiveId || hive.id}</strong>
            <span style="background: #fef3c7; color: #92400e; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px;">
              ${hive.colonyType || 'Apis'}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.5;">
            <div><strong>${t('market.beekeeper')}:</strong> ${beekeeperName}</div>
            <div><strong>${t('hive.area')}:</strong> ${hive.area || 'Apiary'}</div>
            <div><strong>${t('nav.hives')}:</strong> ${hive.hiveType || 'Standard'}</div>
            <div><strong>GPS:</strong> ${hive.lat.toFixed(4)}°N, ${hive.lng.toFixed(4)}°E</div>
            ${hive.iotDeviceId ? `<div><strong>IoT Serial:</strong> <code style="color: #d97706;">${hive.iotDeviceId}</code></div>` : ''}
            ${bkp?.trustScore ? `<div><strong>Trust Score:</strong> <span style="color: #10b981; font-weight: bold;">${bkp.trustScore}/100</span></div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      if (onSelectHive) {
        marker.on('click', () => onSelectHive(hive.id));
      }
      marker.addTo(markersLayer);
    });

    if (hives.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }

    return () => {
      // Clean marker layers on update
      markersLayer.clearLayers();
    };
  }, [hives, beekeepers, language]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />
      <div className="absolute top-3 right-3 z-1000 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        <span>{hives.length} {t('tracked hives')} ({beekeepers.length || '12'} {t('state:').replace(':', '')}s)</span>
      </div>
    </div>
  );
};
