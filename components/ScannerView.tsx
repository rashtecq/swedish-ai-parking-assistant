
import React, { useState, useRef, useEffect } from 'react';
import { analyzeParkingSign } from '../services/geminiService';
import { ParkingAnalysis } from '../types';

const ScannerView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParkingAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraNotFound, setCameraNotFound] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraNotFound(false);
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support camera access.");
      setCameraNotFound(true);
      return;
    }

    try {
      stopCamera();
      
      let stream: MediaStream;
      
      try {
        // Try preferred constraints first (Rear camera on mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e) {
        console.warn("Preferred camera constraints failed, falling back to simple video constraint.", e);
        // Fallback 1: Any video device
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (e2) {
          console.error("All camera constraints failed:", e2);
          throw e2; // Re-throw to be caught by the outer catch
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraReady(true);
        setError(null);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraNotFound(true);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera found on this device.");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please enable it in your settings.");
      } else {
        setError("Unable to access camera. Please use the gallery instead.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      processImage(base64);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      processImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setCapturedImage(base64);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      stopCamera();
      const analysis = await analyzeParkingSign(base64);
      setResult(analysis);
    } catch (err) {
      setError("AI could not interpret the sign. Ensure it's well-lit and clearly visible.");
      if (!cameraNotFound) startCamera(); 
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    if (!cameraNotFound) {
      startCamera();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="relative flex-1 overflow-hidden">
        {/* Only show video if not in error state/upload mode */}
        {!cameraNotFound && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${capturedImage ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {/* Static background if no camera */}
        {cameraNotFound && !capturedImage && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
            <div className="bg-slate-800 p-6 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg">Camera Unavailable</h3>
            <p className="text-slate-400 text-sm mt-2">We couldn't detect a camera. You can still upload a photo of a parking sign.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-all shadow-lg"
            >
              Upload from Gallery
            </button>
          </div>
        )}

        {capturedImage && (
          <img 
            src={capturedImage} 
            className="absolute inset-0 w-full h-full object-cover"
            alt="Captured"
          />
        )}

        {isCameraReady && !capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[40px] border-black/40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-white/50 rounded-2xl flex items-center justify-center">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              <div className="w-full h-[2px] bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_infinite_linear] absolute top-0"></div>
            </div>
            <div className="absolute bottom-12 left-0 right-0 text-center">
              <p className="text-white text-sm font-medium bg-black/40 backdrop-blur-md inline-block px-4 py-2 rounded-full">
                Align parking sign within the box
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Analyzing Swedish Regulations</h3>
            <p className="text-blue-100 text-sm max-w-[200px]">Consulting current date/time and municipal parking laws...</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className="bg-white rounded-t-[32px] -mt-8 relative z-10 p-6 shadow-2xl min-h-[180px]">
        {!result && !error && !loading && !cameraNotFound && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
               <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shadow active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              <button
                onClick={handleCapture}
                disabled={!isCameraReady}
                className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 ring-4 ring-blue-100"
              >
                <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full opacity-20"></div>
                </div>
              </button>

              <div className="w-12"></div> {/* Spacer for symmetry */}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tap to Scan</p>
          </div>
        )}

        {result && (
          <div className="animate-in slide-in-from-bottom duration-300">
            <div className={`flex items-start gap-4 p-4 rounded-2xl mb-4 ${
              result.status === 'ALLOWED' ? 'bg-green-50' : 
              result.status === 'FORBIDDEN' ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <div className={`p-2 rounded-lg ${
                result.status === 'ALLOWED' ? 'text-green-600' : 
                result.status === 'FORBIDDEN' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {result.status === 'ALLOWED' ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{result.summary}</h4>
                <div className="mt-1 space-y-0.5">
                  {result.details.map((d, i) => (
                    <p key={i} className="text-xs text-slate-600">• {d}</p>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleReset}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Scan Another Sign
            </button>
          </div>
        )}

        {error && (
          <div className="text-center space-y-4">
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold"
              >
                Upload Photo
              </button>
              {!cameraNotFound && (
                <button 
                  onClick={handleReset}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold"
                >
                  Retry Camera
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ScannerView;
