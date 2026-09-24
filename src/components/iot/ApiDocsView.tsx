import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Send,
  Cpu,
  AlertTriangle,
  Play,
  Terminal,
  BookOpen,
  Wifi,
  Radio,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ApiDocsView: React.FC = () => {
  const { beekeeperProfile } = useAuth();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Live Simulator State
  const [simSerial, setSimSerial] = useState('HC-IOT-09281');
  const [simApiKey, setSimApiKey] = useState('hc_iot_demo_key_123');
  const [simTemp, setSimTemp] = useState(34.5);
  const [simHum, setSimHum] = useState(62);
  const [simWeight, setSimWeight] = useState(25.4);
  const [simBattery, setSimBattery] = useState(94);
  const [simSending, setSimSending] = useState(false);
  const [simResponse, setSimResponse] = useState<string | null>(null);

  const copyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const handleSimulateSend = async (tempVal: number, humVal: number) => {
    setSimSending(true);
    setSimResponse(null);

    try {
      const res = await fetch('/api/iot/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': simApiKey,
        },
        body: JSON.stringify({
          deviceSerial: simSerial,
          temperature: tempVal,
          humidity: humVal,
          weight: simWeight,
          battery: simBattery,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      setSimResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setSimResponse(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSimSending(false);
    }
  };

  const esp32Code = `// Honey Chain IoT Sensor Node Firmware (ESP32-S3 / ESP8266)
// Libraries required: WiFi.h, HTTPClient.h, ArduinoJson.h, DHT.h

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

// 1. WiFi Credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Honey Chain Apiary Device Credentials (generated during pairing)
const char* INGESTION_URL = "https://your-domain.run.app/api/iot/readings";
const char* DEVICE_SERIAL = "HC-IOT-09281";
const char* API_KEY       = "hc_iot_your_private_api_key_here";

// 3. Sensor Setup (DHT22 on GPIO 4)
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    
    // Check if reading is valid
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Failed to read from DHT sensor!");
      delay(10000);
      return;
    }
    
    HTTPClient http;
    http.begin(INGESTION_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", API_KEY);

    // Build JSON payload
    StaticJsonDocument<256> doc;
    doc["deviceSerial"] = DEVICE_SERIAL;
    doc["temperature"]  = temperature;
    doc["humidity"]     = humidity;
    doc["weight"]       = 24.8;  // HX711 load cell reading
    doc["battery"]      = 96;    // Battery voltage percentage

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.printf("HTTP Response code: %d\\n", httpResponseCode);
    String response = http.getString();
    Serial.println(response);

    http.end();
  }

  // Deep sleep / transmission interval: 5 minutes (300,000 ms)
  delay(300000);
}`;

  const curlExample = `curl -X POST https://ais-dev-ak2eflxv6d7fkujzgspmqe-254373374996.asia-southeast1.run.app/api/iot/readings \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hc_iot_your_key_here" \\
  -d '{
    "deviceSerial": "HC-IOT-09281",
    "temperature": 34.5,
    "humidity": 62.0,
    "weight": 25.4,
    "battery": 94
  }'`;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-amber-500" />
          IoT Hardware Developer API & ESP32 Integration Docs
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Specification for connecting remote apiary sensor nodes (ESP32, Raspberry Pi Pico W, cellular GSM) to the Honey Chain automated health tracking and anomaly detection engine.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Wifi className="w-4 h-4 text-amber-500" /> Protocol & Transport
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            HTTPS POST over TLS 1.3. Microcontrollers can use WiFi, 4G LTE-M / NB-IoT SIM modules, or LoRaWAN gateways.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Terminal className="w-4 h-4 text-emerald-500" /> SHA-256 Hashed Auth
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Every paired device gets an API key (<code className="font-mono text-amber-600">hc_iot_...</code>). The raw key is never stored in plaintext on the database.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Out-of-Range Alarms
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Telemetry is evaluated against species thresholds. Abnormal temperatures (e.g. &gt;36.5°C) generate instant in-app alerts and notifications.
          </p>
        </div>
      </div>

      {/* Live Ingestion Simulator Workbench */}
      <div className="p-6 rounded-3xl bg-slate-950 text-white border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Play className="w-4 h-4 fill-amber-400" />
              Live Ingestion Pipeline Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Test sending readings directly to <code className="text-amber-300 font-mono">/api/iot/readings</code>. Test normal readings or simulate thermal stress!
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
            Interactive Testbed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Device Serial</label>
            <input
              type="text"
              value={simSerial}
              onChange={(e) => setSimSerial(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Device API Key</label>
            <input
              type="text"
              value={simApiKey}
              onChange={(e) => setSimApiKey(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={simTemp}
              onChange={(e) => setSimTemp(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Humidity (%)</label>
            <input
              type="number"
              value={simHum}
              onChange={(e) => setSimHum(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleSimulateSend(34.5, 62)}
            disabled={simSending}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
          >
            Push Normal Reading (34.5°C, 62%)
          </button>

          <button
            onClick={() => handleSimulateSend(41.8, 48)}
            disabled={simSending}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
          >
            Simulate Overheating Alarm (41.8°C!)
          </button>

          <button
            onClick={() => handleSimulateSend(24.0, 50)}
            disabled={simSending}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
          >
            Simulate Chilled Brood Alarm (24°C!)
          </button>
        </div>

        {simResponse && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
            <span className="text-slate-500 block mb-1">Response from /api/iot/readings:</span>
            <pre>{simResponse}</pre>
          </div>
        )}
      </div>

      {/* ESP32 Arduino C++ Code Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-500" />
            Complete ESP32 Arduino C++ Sketch
          </h3>
          <button
            onClick={() => copyText(esp32Code, 'esp32')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
          >
            {copiedSection === 'esp32' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'esp32' ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="rounded-2xl bg-slate-950 text-slate-300 p-4 font-mono text-xs overflow-x-auto border border-slate-800 max-h-96">
          <pre>{esp32Code}</pre>
        </div>
      </div>

      {/* cURL Example */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-500" />
            cURL Request Example
          </h3>
          <button
            onClick={() => copyText(curlExample, 'curl')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
          >
            {copiedSection === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'curl' ? 'Copied!' : 'Copy cURL'}</span>
          </button>
        </div>

        <div className="rounded-2xl bg-slate-950 text-amber-300 p-4 font-mono text-xs overflow-x-auto border border-slate-800">
          <pre>{curlExample}</pre>
        </div>
      </div>
    </div>
  );
};
