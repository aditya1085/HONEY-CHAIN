import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, RefreshCw, Check, X, Upload, AlertCircle, Plus, Trash2 } from 'lucide-react';

export interface CapturedPhoto {
  id: string;
  blob: Blob;
  dataUrl: string;
  timestamp: string;
}

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photos: CapturedPhoto[]) => void;
  multiPhoto?: boolean;
  maxPhotos?: number;
  title?: string;
  description?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  multiPhoto = false,
  maxPhotos = 4,
  title = 'Capture Apiary / Hive Photo',
  description = 'Align frame properly in bright natural light',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [capturedList, setCapturedList] = useState<CapturedPhoto[]>([]);

  // Stop media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start media stream
  const startCamera = useCallback(async () => {
    stopStream();
    setErrorMsg(null);
    setIsInitializing(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not supported in this browser environment. Please use file upload.');
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
      setHasTorch(Boolean(capabilities?.torch));
      setTorchOn(false);
    } catch (err: unknown) {
      console.warn('Camera stream failed:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('Camera permission was denied. Please allow camera permissions in browser settings, or choose file upload.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMsg('No camera device detected on this system. Please upload a photo from storage.');
        } else {
          setErrorMsg(`Unable to open camera: ${err.message}. You can still upload images directly.`);
        }
      } else {
        setErrorMsg('Camera initialization failed. Please use file upload.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedList([]);
      setErrorMsg(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Switch front/back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle flashlight / torch if supported
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const next = !torchOn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (track as any).applyConstraints({
        advanced: [{ torch: next }],
      });
      setTorchOn(next);
    } catch (e) {
      console.warn('Torch constraint error:', e);
    }
  };

  // Compress & take snapshot from current frame
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    const MAX_DIM = 1280;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
      if (width > MAX_DIM) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      }
    } else {
      if (height > MAX_DIM) {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const newPhoto: CapturedPhoto = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          blob,
          dataUrl,
          timestamp: new Date().toISOString(),
        };

        if (multiPhoto) {
          setCapturedList((prev) => [...prev, newPhoto]);
        } else {
          setCapturedList([newPhoto]);
        }
      },
      'image/jpeg',
      0.85
    );
  };

  // Handle local file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target?.result as string;
        const photo: CapturedPhoto = {
          id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          blob: file,
          dataUrl,
          timestamp: new Date().toISOString(),
        };

        if (multiPhoto) {
          setCapturedList((prev) => [...prev, photo]);
        } else {
          setCapturedList([photo]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    setCapturedList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConfirm = () => {
    if (capturedList.length > 0) {
      onCapture(capturedList);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-xl bg-slate-900 rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-white">
          <div>
            <h3 className="font-semibold text-amber-400 text-base">{title}</h3>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Video */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center max-w-md">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-4">{errorMsg}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition"
              >
                <Upload className="w-4 h-4" /> Choose from Gallery / Storage
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* Camera viewfinder overlay lines */}
              <div className="absolute inset-8 pointer-events-none border border-amber-400/40 rounded-xl">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
              </div>
            </>
          )}

          {/* Overlaid Camera Controls */}
          {!errorMsg && (
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={toggleFacingMode}
                title="Switch Camera (Front/Back)"
                className="p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-amber-600 transition backdrop-blur-md"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  title="Flashlight Toggle"
                  className={`p-2.5 rounded-full backdrop-blur-md transition ${
                    torchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/80 text-white hover:bg-slate-800'
                  }`}
                >
                  {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Captured Gallery Preview (for multi-photo or review) */}
        {capturedList.length > 0 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Captured Photos ({capturedList.length}{multiPhoto ? `/${maxPhotos}` : ''})
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {capturedList.map((photo, idx) => (
                <div key={photo.id} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-amber-500/50 group">
                  <img src={photo.dataUrl} alt={`Captured ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-red-400"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Shutter & Action Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiPhoto}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 rounded-xl transition"
            title="Upload from disk"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Upload File</span>
          </button>

          {/* Shutter Button */}
          {!errorMsg && (
            <button
              onClick={takeSnapshot}
              disabled={isInitializing || (multiPhoto && capturedList.length >= maxPhotos)}
              className="relative flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 transition disabled:opacity-50 active:scale-95"
              aria-label="Take Photo"
            >
              <div className="w-11 h-11 rounded-full border-2 border-slate-950 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
            </button>
          )}

          {/* Submit/Confirm captured photos */}
          <button
            onClick={handleConfirm}
            disabled={capturedList.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow transition disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Use {capturedList.length ? `(${capturedList.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
