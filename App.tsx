
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GalleryItem, OriginalImage } from './types';
import { analyzeImage, editImage, generateImage } from './services/geminiService';
import { UploadIcon, SparklesIcon, DownloadIcon, ImageIcon, GalleryIcon, TrashIcon, ArrowRightIcon, DiamondIcon, CrownIcon, LogOutIcon } from './components/Icons';
import ReactCompareImage from 'react-compare-image';
import { LandingPage } from './components/LandingPage';
import { LoginScreen, User, UpgradeModal } from './components/Auth';

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

// --- Reusable UI Components ---

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

const ProgressBar: React.FC = () => (
    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div className="bg-primary h-2 rounded-full w-full animate-pulse"></div>
    </div>
);

const LoadingState: React.FC<{ message: string, onCancel?: () => void }> = ({ message, onCancel }) => (
    <div className="w-full max-w-2xl mx-auto text-center p-8 border-2 border-dashed border-slate-300 rounded-xl">
        <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-slate-600 font-medium">{message}</p>
            <ProgressBar />
            {onCancel && (
              <Button variant="secondary" onClick={onCancel} className="mt-4">
                Cancel
              </Button>
            )}
        </div>
    </div>
);


// --- Main App Component ---
enum Tab { TRANSFORM, GENERATE, GALLERY }
enum TransformStep { UPLOAD, EDIT, RESULT }
enum GenerateStep { PROMPT, RESULT }

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  // Auth & Freemium State - Updated keys to "sellshot"
  const [user, setUser] = useLocalStorage<User | null>('sellshot-user', null);
  const [credits, setCredits] = useLocalStorage<number>('sellshot-credits', 5); // Start with 5 credits for demo
  const [isPremium, setIsPremium] = useLocalStorage<boolean>('sellshot-premium', false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
  const [gallery, setGallery] = useLocalStorage<GalleryItem[]>('sellshot-gallery', []);

  const dropzoneRef = useRef<HTMLDivElement>(null);

  const checkCredits = useCallback(() => {
    if (isPremium) return true;
    if (credits > 0) return true;
    setShowUpgradeModal(true);
    return false;
  }, [credits, isPremium]);

  const consumeCredit = useCallback(() => {
      if (!isPremium && credits > 0) {
          setCredits(prev => prev - 1);
      }
  }, [isPremium, credits, setCredits]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowLogin(false);
    setShowApp(true);
  };

  const handleLogout = () => {
      setUser(null);
      setShowApp(false);
      setShowLogin(true);
      // Optional: Reset app state
      resetTransform();
      resetGenerate();
  };

  const handleUpgrade = () => {
      setIsPremium(true);
      setCredits(9999); // Or manage logic differently
  }

  const resetTransform = useCallback(() => {
    setTransformStep(TransformStep.UPLOAD);
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setSuggestions([]);
    setRefinePrompt('');
    setError(null);
    setIsAnalyzing(false);
    setIsLoading(false);
    setIsRefining(false);
  }, []);

  const resetGenerate = useCallback(() => {
    setGenerateStep(GenerateStep.PROMPT);
    setGeneratedImage(null);
    setPreviousGeneratedImage(null);
    setInitialGeneratedImage(null);
    setGeneratePrompt('');
    setRefinePrompt('');
    setError(null);
    setIsLoading(false);
    setIsRefining(false);
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
    if (!checkCredits()) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await editImage(originalImage.dataUrl, prompt);
      setEditedImage(result);
      setTransformStep(TransformStep.RESULT);
      consumeCredit();
      
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
  }, [originalImage, prompt, setGallery, checkCredits, consumeCredit]);

  const handleGenerate = useCallback(async () => {
    if (!generatePrompt) return;
    if (!checkCredits()) return;

    setIsLoading(true);
    setError(null);
    setPreviousGeneratedImage(null);
    try {
        const result = await generateImage(generatePrompt);
        setGeneratedImage(result);
        setInitialGeneratedImage(result);
        setGenerateStep(GenerateStep.RESULT);
        consumeCredit();

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
  }, [generatePrompt, setGallery, checkCredits, consumeCredit]);

  const handleRefineTransform = useCallback(async () => {
    if (!editedImage || !refinePrompt) return;
    if (!checkCredits()) return;

    setIsRefining(true);
    setError(null);
    try {
        const result = await editImage(editedImage, refinePrompt);
        setEditedImage(result);
        setRefinePrompt(''); // Clear prompt after use
        consumeCredit();
        
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
  }, [editedImage, refinePrompt, originalImage, setGallery, checkCredits, consumeCredit]);

  const handleRefineGenerate = useCallback(async () => {
    if (!generatedImage || !refinePrompt) return;
    if (!checkCredits()) return;

    setIsRefining(true);
    setError(null);
    try {
        setPreviousGeneratedImage(generatedImage);
        const result = await editImage(generatedImage, refinePrompt);
        setGeneratedImage(result);
        setRefinePrompt('');
        consumeCredit();

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
  }, [generatedImage, refinePrompt, initialGeneratedImage, setGallery, checkCredits, consumeCredit]);


  const handleGoToHome = useCallback(() => {
    // Just reset internal state, stay logged in
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

  const onGetStarted = () => {
      if (user) {
          setShowApp(true);
      } else {
          setShowLogin(true);
      }
  }
  
  if (!showApp && !showLogin) {
    return <LandingPage onGetStarted={onGetStarted} />;
  }

  if (showLogin && !user) {
      return <LoginScreen onLogin={handleLogin} />
  }

  const renderTransformView = () => {
    switch (transformStep) {
      case TransformStep.UPLOAD:
        return isAnalyzing ? (
            <LoadingState message="Analyzing your image..." onCancel={resetTransform} />
        ) : (
          <div 
            ref={dropzoneRef}
            className="w-full max-w-2xl mx-auto text-center p-12 border-2 border-dashed border-slate-300 rounded-xl transition-colors duration-300 hover:bg-slate-50 cursor-pointer"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
               <UploadIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Upload Product Photo</h3>
            <p className="mt-2 text-slate-500">Drag & drop or click to browse (JPG, PNG, WebP)</p>
            <Button className="mt-8 pointer-events-none">
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
              <div className="aspect-square w-full bg-slate-100 rounded-lg overflow-hidden ring-1 ring-slate-200 flex items-center justify-center">
                {originalImage && <img src={originalImage.dataUrl} alt="Original product" className="max-w-full max-h-full object-contain" />}
              </div>
               <Button variant="secondary" onClick={resetTransform} disabled={isLoading || isAnalyzing} className="w-full">Change Image</Button>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">AI Studio Settings</h3>
              <div className="space-y-2">
                <h4 id="prompt-label" className="text-sm font-medium text-slate-700">Describe your desired shot</h4>
                <textarea
                  aria-labelledby="prompt-label"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A professional studio shot of the product on a marble surface with soft, natural lighting..."
                  className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  disabled={isLoading || isAnalyzing}
                />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-amber-500" /> AI Suggestions</h4>
                {suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => setPrompt(s)} 
                        disabled={isLoading || isAnalyzing}
                        className={`w-full text-left p-3 rounded-lg text-xs transition-all duration-200 border ${
                          prompt === s 
                          ? 'bg-primary/5 border-primary text-primary' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">Upload an image to see magic suggestions</div>
                )}
              </div>
              {isLoading ? (
                <div className="w-full space-y-3 pt-4">
                    <p className="text-sm text-center text-slate-600 font-medium animate-pulse">Creating your masterpiece...</p>
                    <ProgressBar />
                    <Button variant="secondary" onClick={resetTransform} className="w-full mt-2">Cancel</Button>
                </div>
              ) : (
                <Button onClick={handleTransform} disabled={isAnalyzing || !prompt} className="w-full h-12 text-lg shadow-lg shadow-primary/20">
                    <SparklesIcon className="w-5 h-5 mr-2" /> Transform Image <span className="ml-2 opacity-70 text-xs font-normal border border-white/30 px-1.5 rounded">1 credit</span>
                </Button>
              )}
            </div>
          </div>
        );
      case TransformStep.RESULT:
          return (
              <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight">Studio Magic Complete</h2>
                    <p className="text-slate-600 mt-2">Compare the results and refine if needed.</p>
                  </div>
                  
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                      <div className="rounded-lg overflow-hidden relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-50">
                          {originalImage && editedImage && (
                              <ReactCompareImage leftImage={originalImage.dataUrl} rightImage={editedImage} />
                          )}
                      </div>
                  </div>
                  
                  <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                      <Button variant="secondary" onClick={resetTransform} className="w-full sm:w-auto h-11">Start New Project</Button>
                      <Button onClick={() => downloadImage(editedImage!, 'sellshot-transformed.png')} className="w-full sm:w-auto h-11">
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Download HD
                      </Button>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-200 bg-slate-50/50 p-6 rounded-xl">
                     <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                         <SparklesIcon className="w-5 h-5 text-primary" /> Refine Result
                     </h3>
                     <div className="flex gap-2">
                         <input 
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="e.g. Make the background lighter, add reflection..."
                            className="flex-1 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={isRefining}
                         />
                         <Button onClick={handleRefineTransform} disabled={!refinePrompt || isRefining}>
                             {isRefining ? '...' : 'Refine (1 credit)'}
                         </Button>
                     </div>
                     {isRefining && <div className="mt-2"><ProgressBar /></div>}
                  </div>
              </div>
          );
    }
  };

   const renderGenerateView = () => {
    switch(generateStep) {
        case GenerateStep.PROMPT:
            return (
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                         <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                            <ImageIcon className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-3">Generate From Scratch</h2>
                        <p className="text-slate-600 max-w-lg mx-auto">No product photo? No problem. Describe what you want to see and our AI will create a photorealistic mockup.</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Prompt</label>
                        <textarea 
                            value={generatePrompt}
                            onChange={(e) => setGeneratePrompt(e.target.value)}
                            placeholder="A sleek, modern smartwatch on a dark, textured background with dramatic side lighting highlighting the metallic finish..."
                            className="w-full h-40 p-4 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            disabled={isLoading}
                        />
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-slate-400">Be descriptive for best results.</span>
                            {isLoading ? (
                                <span className="text-sm text-slate-600 animate-pulse">Generating...</span>
                            ) : (
                                <Button onClick={handleGenerate} disabled={!generatePrompt} size="lg" className="shadow-md shadow-primary/20">
                                    <SparklesIcon className="w-4 h-4 mr-2" /> Generate (1 credit)
                                </Button>
                            )}
                        </div>
                        {isLoading && <div className="mt-4"><ProgressBar /></div>}
                    </div>
                </div>
            );
        case GenerateStep.RESULT:
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight">Generation Complete</h2>
                    </div>

                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                        <div className="rounded-lg overflow-hidden">
                            {previousGeneratedImage && generatedImage ? (
                            <ReactCompareImage leftImage={previousGeneratedImage} rightImage={generatedImage} />
                            ) : generatedImage && (
                            <img src={generatedImage} alt={generatePrompt} className="w-full h-auto object-contain max-h-[600px] mx-auto" />
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <Button variant="secondary" onClick={resetGenerate} className="h-11">Generate New</Button>
                        <Button onClick={() => downloadImage(generatedImage!, 'sellshot-generated.png')} className="h-11">
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-200 bg-slate-50/50 p-6 rounded-xl">
                         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                             <SparklesIcon className="w-5 h-5 text-primary" /> Refine Generation
                         </h3>
                         <div className="flex gap-2">
                             <input 
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                placeholder="e.g. Change lighting to sunset, add water droplets..."
                                className="flex-1 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                disabled={isRefining}
                             />
                             <Button onClick={handleRefineGenerate} disabled={!refinePrompt || isRefining}>
                                 {isRefining ? '...' : 'Refine (1 credit)'}
                             </Button>
                         </div>
                         {isRefining && <div className="mt-2"><ProgressBar /></div>}
                    </div>
                </div>
            );
    }
  };

  const renderGalleryView = () => (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Your Gallery</h2>
            <p className="text-slate-500 mt-1">All your created assets in one place.</p>
        </div>
        <div className="text-sm text-slate-400">{gallery.length} images</div>
      </div>
      
      {gallery.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <GalleryIcon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Gallery is empty</h3>
            <p className="text-slate-500 mt-1">Start transforming or generating images to see them here.</p>
            <Button onClick={() => setActiveTab(Tab.TRANSFORM)} className="mt-6">Create First Image</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gallery.map(item => (
            <div key={item.id} className="group relative border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-all duration-300">
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img src={item.src} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                <p className="text-white text-xs line-clamp-2 mb-3 font-medium">{item.prompt}</p>
                <div className="flex gap-2">
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white text-slate-900" onClick={() => downloadImage(item.src, `sellshot-${item.id}.png`)}>
                    <DownloadIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-red-500/90 hover:bg-red-500 text-white border-0" onClick={() => deleteFromGallery(item.id)}>
                    <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
              </div>
              
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
                  {item.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <button onClick={handleGoToHome} className="text-xl font-bold flex items-center gap-2 focus:outline-none text-slate-900">
            <SparklesIcon className="w-6 h-6 text-primary"/> Sellshot AI
          </button>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
             <nav className="flex items-center bg-slate-100 p-1 rounded-lg">
                {[
                { label: 'Transform', icon: <ArrowRightIcon className="w-4 h-4" />, tab: Tab.TRANSFORM },
                { label: 'Generate', icon: <ImageIcon className="w-4 h-4" />, tab: Tab.GENERATE },
                { label: 'Gallery', icon: <GalleryIcon className="w-4 h-4" />, tab: Tab.GALLERY }
                ].map(({ label, icon, tab }) => (
                    <button 
                    key={label}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                    {icon} {label}
                    </button>
                ))}
             </nav>

             <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                 {/* Credits Pill */}
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isPremium ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {isPremium ? <CrownIcon className="w-4 h-4 text-amber-500" /> : <DiamondIcon className="w-4 h-4 text-blue-500" />}
                    {isPremium ? 'Unlimited' : `${credits} Credits`}
                 </div>
                 
                 {!isPremium && (
                     <Button size="default" className="h-9 text-xs" onClick={() => setShowUpgradeModal(true)}>Upgrade</Button>
                 )}

                 {/* User Profile */}
                 <div className="flex items-center gap-3 group cursor-pointer relative">
                    <img src={user?.avatarUrl} alt={user?.name} className="w-9 h-9 rounded-full border border-slate-200" />
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border border-slate-100 p-1 hidden group-hover:block">
                        <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100 mb-1">{user?.email}</div>
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2">
                            <LogOutIcon className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-center gap-3 shadow-sm max-w-4xl mx-auto">
                <div className="bg-red-100 p-1 rounded-full"><span className="text-xl block h-6 w-6 text-center leading-6">!</span></div>
                <div>
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
                <button onClick={() => setError(null)} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                    <span className="text-xl">×</span>
                </button>
            </div>
        )}
        
        <div className="transition-all duration-300 ease-in-out">
            {activeTab === Tab.TRANSFORM && renderTransformView()}
            {activeTab === Tab.GENERATE && renderGenerateView()}
            {activeTab === Tab.GALLERY && renderGalleryView()}
        </div>
      </main>
      
      {showUpgradeModal && (
          <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} />
      )}

      <footer className="text-center py-8 text-sm text-slate-400 border-t border-slate-200 mt-12">
        <p>&copy; 2024 Sellshot AI. Powered by Gemini.</p>
      </footer>
    </div>
  );
}
