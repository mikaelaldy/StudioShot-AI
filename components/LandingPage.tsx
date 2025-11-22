
import React from 'react';
import { SparklesIcon, UploadIcon, ImageIcon, ArrowRightIcon } from './Icons';
import { 
  friedRiceAfter,
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

export const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-primary"/> Sellshot AI
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
                <div className="rounded-xl shadow-lg overflow-hidden">
                    <img 
                      src={friedRiceAfter}
                      alt="A professionally photographed plate of fried rice with dramatic lighting."
                      className="w-full h-full object-cover aspect-square"
                    />
                </div>
                <div>
                    <h3 className="text-3xl font-bold tracking-tight">Powerful Features for Perfect Shots</h3>
                    <p className="mt-4 text-slate-600">Sellshot is more than just a filter. It's a suite of AI-powered tools designed for e-commerce success.</p>
                    <ul className="mt-8 space-y-4">
                        <li className="flex gap-4">
                            <SparklesIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
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
              Launch Sellshot AI
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
