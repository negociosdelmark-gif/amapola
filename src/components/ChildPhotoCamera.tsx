import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Upload, Image, AlertCircle } from 'lucide-react';
import { logAnalyticsEvent } from '../lib/firebase';

interface ChildPhotoCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture: (base64Data: string) => void;
  childName: string;
}

export default function ChildPhotoCamera({ isOpen, onClose, onPhotoCapture, childName }: ChildPhotoCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Start camera stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setCapturedPhoto(null);

    try {
      // If there's an existing stream, stop it first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
          aspectRatio: { ideal: 1 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error starting camera:', err);
      let errorMsg = 'No se pudo acceder a la cámara.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Permiso denegado. Por favor, concede permisos de cámara en tu navegador o usa la opción de subir foto.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No se encontró ninguna cámara disponible en este dispositivo.';
      }
      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  // Switch between front and back camera
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Whenever facingMode changes and camera is active, restart the stream
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Handle stream assignment to video element when stream is updated
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Clean up stream on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      setIsCameraActive(false);
    }
  }, [isOpen]);

  // Take photo from video stream
  const takePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // We want a square crop for optimal profile preview
      const size = Math.min(video.videoWidth, video.videoHeight) || 480;
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center crop the video feed
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        ctx.drawImage(
          video,
          sx, sy, size, size, // source coords
          0, 0, size, size   // dest coords
        );
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
        logAnalyticsEvent('capture_child_photo_camera', { childName });
      }
    }
  };

  // File Upload Handlers (for drag-and-drop and fallback upload)
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona únicamente archivos de imagen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setCapturedPhoto(e.target.result);
        stopCamera();
        logAnalyticsEvent('upload_child_photo_file', { childName });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const savePhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
              <Camera className="w-5 h-5 text-teal-600" /> Foto de Perfil
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Asignar foto de {childName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-100/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-200/60 overflow-hidden flex flex-col items-center justify-center">
          
          {/* 1. Captured Photo Preview Mode */}
          {capturedPhoto && (
            <div className="absolute inset-0 flex flex-col">
              <img 
                src={capturedPhoto} 
                alt="Vista previa de captura" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCapturedPhoto(null)}
                  className="flex-1 py-2 bg-white/20 hover:bg-white/30 active:scale-[0.98] border border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Repetir</span>
                </button>
                <button
                  type="button"
                  onClick={savePhoto}
                  className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10"
                >
                  <Check className="w-4 h-4" />
                  <span>Usar Foto</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Live Camera Mode */}
          {!capturedPhoto && isCameraActive && (
            <div className="absolute inset-0 flex flex-col bg-black">
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // mirror for intuitive selfie layout
              />
              
              {/* Circular Overlay Guide */}
              <div className="absolute inset-0 border-[24px] border-black/50 pointer-events-none flex items-center justify-center">
                <div className="w-full aspect-square rounded-full border-2 border-dashed border-teal-400/80 bg-transparent animate-pulse" />
              </div>

              {/* Camera Controls Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-black/40 hover:bg-black/60 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={takePhoto}
                  className="w-14 h-14 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-lg border-4 border-teal-500"
                  aria-label="Capturar fotografía"
                >
                  <div className="w-10 h-10 bg-slate-900 hover:bg-teal-600 rounded-full transition-colors" />
                </button>

                {/* Switch camera mode */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2.5 bg-black/40 hover:bg-black/60 text-white border border-white/10 rounded-xl cursor-pointer"
                  title="Cambiar Cámara"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 3. Empty/Selector Mode (Choose Camera or Upload) */}
          {!capturedPhoto && !isCameraActive && (
            <div 
              className={`absolute inset-0 p-6 flex flex-col items-center justify-center gap-4 text-center transition-all duration-150 select-none ${
                dragActive ? 'bg-teal-50/60 border-2 border-dashed border-teal-400' : ''
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shadow-sm">
                <Image className="w-8 h-8" />
              </div>
              
              <div>
                <h4 className="text-sm font-black text-slate-700">Elige un método</h4>
                <p className="text-xs text-slate-400 font-semibold max-w-[240px] mt-1 leading-relaxed">
                  Toma una foto instantánea o arrastra y suelta un archivo de imagen aquí.
                </p>
              </div>

              {cameraError && (
                <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-2.5 text-[10px] font-semibold max-w-xs flex gap-1.5 items-start text-left">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full max-w-[240px]">
                {/* Activate Camera */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-teal-600/10"
                >
                  <Camera className="w-4 h-4 text-teal-200" />
                  <span>Activar Cámara</span>
                </button>

                {/* Upload File button */}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 border border-slate-200/50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Subir Imagen</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

        </div>

        {/* Info/Warning text */}
        <div className="text-[10px] text-slate-400 font-medium text-center italic bg-slate-50 p-2 rounded-xl border border-slate-100/50">
          La imagen se procesará localmente y se almacenará en la base de datos local de tu navegador.
        </div>

      </div>
    </div>
  );
}
