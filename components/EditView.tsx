
import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';

const EditView: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
      setEditedImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!originalImage || !prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await editImage(originalImage, prompt);
      setEditedImage(result);
    } catch (err) {
      setError("AI was unable to edit the image. Try a simpler prompt.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
  };

  return (
    <div className="p-4 flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">AI Photo Editor</h2>
        <p className="text-slate-500 text-sm mt-1">Transform your photos with text</p>
      </div>

      {!originalImage ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-square border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center gap-4 bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <div className="bg-white p-6 rounded-full shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-purple-600 font-bold uppercase tracking-wide text-xs">Choose Photo to Edit</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="w-full space-y-6">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square bg-slate-200">
            <img 
              src={editedImage || originalImage} 
              alt="Workspace" 
              className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`} 
            />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm text-white">
                <div className="animate-spin h-10 w-10 border-4 border-purple-400 border-t-transparent rounded-full mb-4"></div>
                <p className="font-bold">Applying AI Magic...</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider px-1">What would you like to change?</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Make it look like a vintage postcard' or 'Change the background to a sunset'"
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-28"
            />
            
            <div className="flex gap-2 flex-wrap">
              {["Add retro filter", "Make it snowy", "Sunrise lighting"].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={reset}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold active:scale-95 transition-all"
            >
              Start Over
            </button>
            <button 
              disabled={loading || !prompt.trim()}
              onClick={handleEdit}
              className="flex-[2] bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditView;
