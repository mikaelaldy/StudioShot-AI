import React, { useState, useEffect } from 'react';
import ReactCompareImage from 'react-compare-image';
import { SparklesIcon, UploadIcon, ImageIcon, ArrowRightIcon, CompassIcon } from './Icons';
import { 
  crocsBefore, 
  crocsAfter, 
  friedRiceBefore, 
  friedRiceAfter,
  perfumeBefore,
  perfumeAfter,
  watchBefore,
  watchAfter,
  plantBefore,
  plantAfter
} from './imageData';

// NOTE: This Button component is duplicated from App.tsx.
// For a larger application, it would be beneficial to move this
// and other shared UI components to a dedicated directory.
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

const beforeImage = crocsBefore;
const afterImage = crocsAfter;

const carouselSlides = [
  {
    before: friedRiceBefore,
    after: friedRiceAfter,
    leftImageAlt: "Before: A plate of home-cooked fried rice.",
    rightImageAlt: "After: The same fried rice professionally photographed with dramatic lighting.",
  },
  {
    before: crocsBefore,
    after: crocsAfter,
    leftImageAlt: "Before: A person holding red crocs in front of a bush.",
    rightImageAlt: "After: The red crocs professionally photographed on a clean white background.",
  },
  {
    before: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1887&auto=format&fit=crop",
    after: "https://storage.googleapis.com/aistudio-marketplace-public-assets/assets/0d96d926-7333-4340-9f5a-5f3366c82f42/product_photography_05.png",
    leftImageAlt: "Before: Skincare product in a simple setting",
    rightImageAlt: "After: Skincare product in a professional studio setting with water splashes",
  }
];

const galleryImages = [
    {
        before: perfumeBefore,
        after: perfumeAfter,
        leftAlt: "Before: A perfume bottle on a plain surface.",
        rightAlt: "After: A professional studio shot of the perfume bottle with dramatic lighting and water effects.",
    },
    {
        before: watchBefore,
        after: watchAfter,
        leftAlt: "Before: A simple photo of a wristwatch.",
        rightAlt: "After: A sleek, professional photograph of the wristwatch on a dark, minimalist background.",
    },
    {
        before: plantBefore,
        after: plantAfter,
        leftAlt: "Before: A potted plant in a home setting.",
        rightAlt: "After: The potted plant isolated on a clean, studio-style pastel background.",
    }
];

export const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, carouselSlides.length]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-primary"/> StudioShot AI
          </h1>
          <Button onClick={onGetStarted}>
            Launch App <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      <main>
        <section className="text-center py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              Transform Product Photos into <span className="text-primary">Studio-Quality Images</span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
              Stop paying for expensive photoshoots. Use our AI to analyze, refine, and generate stunning visuals that capture attention and drive sales.
            </p>
            <Button onClick={onGetStarted} size="lg" className="mt-10">
              Get Started for Free
            </Button>
            <div className="max-w-4xl mx-auto mt-16 rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-2xl bg-slate-100">
              <ReactCompareImage leftImage={beforeImage} rightImage={afterImage} leftImageAlt="Before: Red clogs held in front of green foliage." rightImageAlt="After: The same red clogs professionally photographed against a clean white background."/>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold tracking-tight">How It Works in 3 Simple Steps</h3>
            <p className="mt-4 max-w-2xl mx-auto text-slate-600">
              From a simple snapshot to a professional masterpiece, our process is fast and intuitive.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground">
                  <UploadIcon className="w-6 h-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">1. Upload Your Photo</h4>
                <p className="mt-2 text-slate-600">Drag and drop your existing product photo. Our AI gets to work instantly, analyzing its content, lighting, and composition.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground">
                   <SparklesIcon className="w-6 h-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">2. Refine with AI</h4>
                <p className="mt-2 text-slate-600">Use our AI Prompt Assistant to describe your vision, or choose from smart suggestions to improve backgrounds, lighting, and style.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground">
                   <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">3. Transform & Generate</h4>
                <p className="mt-2 text-slate-600">Watch as the AI transforms your image or generates a brand new one based on your prompt. Download your high-resolution result.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
             <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div 
                    className="rounded-xl shadow-lg overflow-hidden relative"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className="relative w-full aspect-square bg-slate-100">
                        {carouselSlides.map((slide, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                                    index === currentSlide ? 'opacity-100 z-10' : 'opacity-0'
                                }`}
                                aria-hidden={index !== currentSlide}
                            >
                                <div className="w-full h-full">
                                    <ReactCompareImage 
                                        leftImage={slide.before} 
                                        rightImage={slide.after} 
                                        leftImageAlt={slide.leftImageAlt}
                                        rightImageAlt={slide.rightImageAlt}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                        {carouselSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentSlide
                                        ? 'bg-white w-6'
                                        : 'bg-white/50 hover:bg-white/75'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-bold tracking-tight">Powerful Features for Perfect Shots</h3>
                    <p className="mt-4 text-slate-600">StudioShot is more than just a filter. It's a suite of AI-powered tools designed for e-commerce success.</p>
                    <ul className="mt-8 space-y-4">
                        <li className="flex gap-4">
                            <CompassIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold">AI Prompt Assistant</h4>
                                <p className="text-slate-600">Never get stuck for ideas. Get intelligent suggestions based on your image to craft the perfect prompt.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <ArrowRightIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold">Image Transformation</h4>
                                <p className="text-slate-600">Edit your existing photos with text commands. Add new backgrounds, adjust lighting, or remove unwanted objects.</p>
                            </div>
                        </li>
                         <li className="flex gap-4">
                            <ImageIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold">Generation From Scratch</h4>
                                <p className="text-slate-600">Have a new product idea? Create stunning visuals from just a text description before you even have a physical sample.</p>
                            </div>
                        </li>
                    </ul>
                </div>
             </div>
        </section>

        <section className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold tracking-tight">Explore the Possibilities</h3>
              <p className="mt-4 max-w-2xl mx-auto text-slate-600">
                See how StudioShot AI can elevate different types of products with just a simple prompt.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {galleryImages.map((image, index) => (
                <div key={index} className="rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-lg bg-white">
                  <ReactCompareImage 
                    leftImage={image.before} 
                    rightImage={image.after} 
                    leftImageAlt={image.leftAlt}
                    rightImageAlt={image.rightAlt}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold tracking-tight">Ready to Elevate Your Brand?</h3>
            <p className="mt-4 max-w-2xl mx-auto text-slate-300">
              Create professional product images that stand out. No credit card required.
            </p>
            <Button 
                onClick={onGetStarted} 
                size="lg" 
                className="mt-10 bg-white text-slate-900 hover:bg-slate-200"
            >
              Launch StudioShot AI
            </Button>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 text-sm text-slate-500 border-t border-slate-200">
        <p>Powered by Gemini. Built for Small Businesses.</p>
      </footer>
    </div>
  );
};
