import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GalleryItem, OriginalImage } from './types';
import { analyzeImage, editImage, generateImage } from './services/geminiService';
import { UploadIcon, SparklesIcon, DownloadIcon, ImageIcon, GalleryIcon, TrashIcon, ArrowRightIcon } from './components/Icons';
import ReactCompareImage from 'react-compare-image';
import { LandingPage } from './components/LandingPage';

// --- Reusable Hook ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// --- Reusable UI Components (defined outside App to prevent re-renders) ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'icon' | 'lg';
}
const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'default', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizeClasses = {
    default: "h-10 py-2 px-4",
    icon: "h-8 w-8",
    lg: 'h-12 px-8 text-base',
  };
  return <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>{children}</button>;
};

const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
);

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
    <div className="w-full max-w-2xl mx-auto text-center p-8 border-2 border-dashed border-slate-300 rounded-xl">
        <div className="flex flex-col items-center justify-center gap-4">
            <Spinner />
            <p className="text-slate-600 font-medium">{message}</p>
        </div>
    </div>
);


// --- Main App Component ---
enum Tab { TRANSFORM, GENERATE, GALLERY }
enum TransformStep { UPLOAD, EDIT, RESULT }
enum GenerateStep { PROMPT, RESULT }

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRANSFORM);
  
  // Transform State
  const [transformStep, setTransformStep] = useState<TransformStep>(TransformStep.UPLOAD);
  const [originalImage, setOriginalImage] = useState<OriginalImage | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Generate State
  const [generateStep, setGenerateStep] = useState<GenerateStep>(GenerateStep.PROMPT);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousGeneratedImage, setPreviousGeneratedImage] = useState<string | null>(null);
  const [initialGeneratedImage, setInitialGeneratedImage] = useState<string | null>(null);

  // Shared State
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useLocalStorage<GalleryItem[]>('studioshot-gallery', []);

  const dropzoneRef = useRef<HTMLDivElement>(null);

  const resetTransform = useCallback(() => {
    setTransformStep(TransformStep.UPLOAD);
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setSuggestions([]);
    setRefinePrompt('');
    setError(null);
  }, []);

  const resetGenerate = useCallback(() => {
    setGenerateStep(GenerateStep.PROMPT);
    setGeneratedImage(null);
    setPreviousGeneratedImage(null);
    setInitialGeneratedImage(null);
    setGeneratePrompt('');
    setRefinePrompt('');
    setError(null);
  }, []);

  const handleImageUpload = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(null);
      const reader = new FileReader();
      reader.onloadstart = () => setIsAnalyzing(true);
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setOriginalImage({ file, dataUrl });
        try {
          const newSuggestions = await analyzeImage(dataUrl);
          setSuggestions(newSuggestions);
          if (newSuggestions.length > 0) {
            setPrompt(newSuggestions[0]);
          }
          setTransformStep(TransformStep.EDIT);
        } catch (err: any) {
          setError(err.message || 'Failed to get suggestions.');
          setSuggestions([]);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please upload a valid image file (JPG, PNG, WebP).');
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneRef.current?.classList.add('border-primary', 'bg-slate-100');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneRef.current?.classList.remove('border-primary', 'bg-slate-100');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneRef.current?.classList.remove('border-primary', 'bg-slate-100');
      handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);


  const handleTransform = useCallback(async () => {
    if (!originalImage || !prompt) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await editImage(originalImage.dataUrl, prompt);
      setEditedImage(result);
      setTransformStep(TransformStep.RESULT);
      
      const newGalleryItem: GalleryItem = {
        id: new Date().toISOString(),
        src: result,
        prompt: prompt,
        type: 'edited',
        originalSrc: originalImage.dataUrl,
      };
      setGallery(prev => [newGalleryItem, ...prev]);

    } catch (err: any) {
      setError(err.message || 'Failed to transform image.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, setGallery]);

  const handleGenerate = useCallback(async () => {
    if (!generatePrompt) return;
    setIsLoading(true);
    setError(null);
    setPreviousGeneratedImage(null);
    try {
        const result = await generateImage(generatePrompt);
        setGeneratedImage(result);
        setInitialGeneratedImage(result);
        setGenerateStep(GenerateStep.RESULT);

        const newGalleryItem: GalleryItem = {
            id: new Date().toISOString(),
            src: result,
            prompt: generatePrompt,
            type: 'generated',
        };
        setGallery(prev => [newGalleryItem, ...prev]);

    } catch (err: any) {
        setError(err.message || 'Failed to generate image.');
    } finally {
        setIsLoading(false);
    }
  }, [generatePrompt, setGallery]);

  const handleRefineTransform = useCallback(async () => {
    if (!editedImage || !refinePrompt) return;
    setIsRefining(true);
    setError(null);
    try {
        const result = await editImage(editedImage, refinePrompt);
        setEditedImage(result);
        setRefinePrompt(''); // Clear prompt after use
        
        const newGalleryItem: GalleryItem = {
            id: new Date().toISOString(),
            src: result,
            prompt: refinePrompt,
            type: 'edited',
            originalSrc: originalImage?.dataUrl,
        };
        setGallery(prev => [newGalleryItem, ...prev]);

    } catch (err: any) {
        setError(err.message || 'Failed to refine image.');
    } finally {
        setIsRefining(false);
    }
  }, [editedImage, refinePrompt, originalImage, setGallery]);

  const handleRefineGenerate = useCallback(async () => {
    if (!generatedImage || !refinePrompt) return;
    setIsRefining(true);
    setError(null);
    try {
        setPreviousGeneratedImage(generatedImage);
        const result = await editImage(generatedImage, refinePrompt);
        setGeneratedImage(result);
        setRefinePrompt('');

        const newGalleryItem: GalleryItem = {
            id: new Date().toISOString(),
            src: result,
            prompt: refinePrompt,
            type: 'edited',
            originalSrc: initialGeneratedImage ?? generatedImage,
        };
        setGallery(prev => [newGalleryItem, ...prev]);
        
    } catch (err: any) {
        setError(err.message || 'Failed to refine image.');
    } finally {
        setIsRefining(false);
    }
  }, [generatedImage, refinePrompt, initialGeneratedImage, setGallery]);


  const handleGoToHome = useCallback(() => {
    setShowApp(false);
    resetTransform();
    resetGenerate();
    setActiveTab(Tab.TRANSFORM);
  }, [resetTransform, resetGenerate]);
  
  const deleteFromGallery = (id: string) => {
    setGallery(gallery.filter(item => item.id !== id));
  };
  
  const downloadImage = (src: string, filename: string) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!showApp) {
    return <LandingPage onGetStarted={() => setShowApp(true)} />;
  }

  const renderTransformView = () => {
    switch (transformStep) {
      case TransformStep.UPLOAD:
        return isAnalyzing ? (
            <LoadingState message="Analyzing your image..." />
        ) : (
          <div 
            ref={dropzoneRef}
            className="w-full max-w-2xl mx-auto text-center p-8 border-2 border-dashed border-slate-300 rounded-xl transition-colors duration-300"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">Drag & drop your photo</h3>
            <p className="mt-1 text-sm text-slate-500">or click to upload a JPG, PNG, or WebP</p>
            <Button className="mt-6" onClick={() => document.getElementById('file-upload')?.click()}>
              Browse Files
            </Button>
            <input id="file-upload" type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e.target.files)} />
          </div>
        );
      case TransformStep.EDIT:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Photo</h3>
              <div className="aspect-square w-full bg-slate-100 rounded-lg overflow-hidden ring-1 ring-slate-200">
                {originalImage && <img src={originalImage.dataUrl} alt="Original product" className="w-full h-full object-contain" />}
              </div>
               <Button variant="secondary" onClick={resetTransform}>Upload New Image</Button>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">AI Prompt Assistant</h3>
              <div className="space-y-2">
                <h4 id="prompt-label" className="text-base font-semibold">Your Prompt</h4>
                <textarea
                  aria-labelledby="prompt-label"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A professional studio shot of the product on a marble surface with soft, natural lighting..."
                  className="w-full h-32 p-2 border border-input rounded-md text-sm bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  disabled={isLoading || isAnalyzing}
                />
              </div>
              <div className="space-y-3">
                <h4 className="text-base font-semibold flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> AI Suggestions</h4>
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => setPrompt(s)} 
                        className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          prompt === s 
                          ? 'bg-primary/10 text-primary ring-1 ring-primary' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                    <p className="text-sm text-slate-500">Upload an image to get AI suggestions.</p>
                )}
              </div>
              <Button onClick={handleTransform} disabled={isLoading || isAnalyzing} className="w-full">
                {isLoading ? <Spinner /> : <><SparklesIcon className="w-4 h-4 mr-2" /> Transform Image</>}
              </Button>
            </div>
          </div>
        );
      case TransformStep.RESULT:
          return (
              <div className="max-w-4xl mx-auto">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Transformation Complete!</h2>
                    <p className="text-slate-600 mb-8">Use the slider to compare your original photo with the AI-enhanced version.</p>
                  </div>
                  <div className="rounded-lg overflow-hidden ring-1 ring-slate-200">
                      {originalImage && editedImage && (
                          <ReactCompareImage leftImage={originalImage.dataUrl} rightImage={editedImage} />
                      )}
                  </div>
                  <div className="mt-8 flex justify-center gap-4">
                      <Button variant="secondary" onClick={resetTransform}>Start Over</Button>
                      <Button onClick={() => downloadImage(editedImage!, 'studioshot-transformed.png')}>
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Download
                      </Button>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-200">
                     <h3 className="text-xl font-semibold text-center mb-4">Refine Your Image</h3>
                     <textarea 
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        placeholder="Not quite right? Describe what you'd like to change... e.g., 'Make the background darker' or 'Add a reflection'"
                        className="w-full h-24 p-3 border border-input rounded-md text-base bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        disabled={isRefining}
                     />
                     <Button onClick={handleRefineTransform} disabled={isRefining || !refinePrompt} className="mt-4 w-full md:w-auto">
                        {isRefining ? <Spinner /> : <><SparklesIcon className="w-4 h-4 mr-2" /> Refine</>}
                    </Button>
                  </div>
              </div>
          );
    }
  };

   const renderGenerateView = () => {
    switch(generateStep) {
        case GenerateStep.PROMPT:
            return (
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Generate Image From Scratch</h2>
                    <p className="text-slate-600 mb-8">Describe the studio-quality image you want to create. Be as descriptive as possible.</p>
                    <textarea 
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                        placeholder="A sleek, modern smartwatch on a dark, textured background with dramatic side lighting highlighting the metallic finish..."
                        className="w-full h-40 p-3 border border-input rounded-md text-base bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !generatePrompt} className="mt-6 w-full md:w-auto">
                        {isLoading ? <Spinner /> : <><SparklesIcon className="w-4 h-4 mr-2" /> Generate Image</>}
                    </Button>
                </div>
            );
        case GenerateStep.RESULT:
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Image Generated!</h2>
                        <p className="text-slate-600 mb-8">Here is the image created from your prompt. Refine it further if needed.</p>
                    </div>

                    <div className="rounded-lg overflow-hidden ring-1 ring-slate-200">
                        {previousGeneratedImage && generatedImage ? (
                           <ReactCompareImage leftImage={previousGeneratedImage} rightImage={generatedImage} />
                        ) : generatedImage && (
                           <img src={generatedImage} alt={generatePrompt} className="w-full h-full object-contain" />
                        )}
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <Button variant="secondary" onClick={resetGenerate}>Generate Another</Button>
                        <Button onClick={() => downloadImage(generatedImage!, 'studioshot-generated.png')}>
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-200">
                         <h3 className="text-xl font-semibold text-center mb-4">Refine Your Image</h3>
                         <textarea 
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="e.g., 'Change the watch face to blue' or 'Add a leather strap'"
                            className="w-full h-24 p-3 border border-input rounded-md text-base bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                            disabled={isRefining}
                         />
                         <Button onClick={handleRefineGenerate} disabled={isRefining || !refinePrompt} className="mt-4 w-full md:w-auto">
                            {isRefining ? <Spinner /> : <><SparklesIcon className="w-4 h-4 mr-2" /> Refine</>}
                        </Button>
                    </div>
                </div>
            );
    }
  };

  const renderGalleryView = () => (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-8">Your Gallery</h2>
      {gallery.length === 0 ? (
        <p className="text-slate-500 text-center py-10">Your generated and transformed images will appear here.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gallery.map(item => (
            <div key={item.id} className="group relative border rounded-lg overflow-hidden shadow-sm bg-card">
              <img src={item.src} alt={item.prompt} className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4">
                <p className="text-white text-sm line-clamp-2">{item.prompt}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" onClick={() => downloadImage(item.src, `studioshot-${item.id}.png`)}>
                  <DownloadIcon className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" className="bg-red-100 text-red-600 hover:bg-red-200" onClick={() => deleteFromGallery(item.id)}>
                   <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={handleGoToHome} className="text-2xl font-bold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
            <SparklesIcon className="w-6 h-6 text-primary"/> StudioShot AI
          </button>
          <nav className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
             {[
               { label: 'Transform', icon: <ArrowRightIcon className="w-4 h-4" />, tab: Tab.TRANSFORM },
               { label: 'Generate', icon: <ImageIcon className="w-4 h-4" />, tab: Tab.GENERATE },
               { label: 'Gallery', icon: <GalleryIcon className="w-4 h-4" />, tab: Tab.GALLERY }
             ].map(({ label, icon, tab }) => (
                <button 
                  key={label}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  {icon} {label}
                </button>
             ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6 max-w-4xl mx-auto" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <span className="text-2xl">&times;</span>
                </button>
            </div>
        )}
        
        {activeTab === Tab.TRANSFORM && renderTransformView()}
        {activeTab === Tab.GENERATE && renderGenerateView()}
        {activeTab === Tab.GALLERY && renderGalleryView()}
      </main>
      
      <footer className="text-center py-6 text-sm text-slate-500 border-t border-slate-200 mt-12">
        <p>Powered by Gemini. Built for Small Businesses.</p>
      </footer>
    </div>
  );
}