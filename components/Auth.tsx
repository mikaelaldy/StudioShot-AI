
import React, { useState } from 'react';
import { GoogleIcon, SparklesIcon, CrownIcon, DiamondIcon } from './Icons';

// NOTE: Duplicating Button for self-containment within this new file, 
// though in a real app it should be imported from a shared ui library.
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

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    // SIMULATION: In a real app, this would call Firebase Auth or Google Identity Services.
    setTimeout(() => {
      const mockUser: User = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: 'Demo User',
        email: 'user@example.com',
        avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix', // Placeholder avatar
      };
      onLogin(mockUser);
      setIsLoggingIn(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to Sellshot</h2>
          <p className="text-slate-600 mt-2 mb-8">Sign in to create professional product photos with AI.</p>
          
          <div className="space-y-4">
             <Button 
              onClick={handleGoogleLogin} 
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm h-12"
              variant="secondary"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <div className="animate-spin h-5 w-5 border-2 border-slate-500 border-t-transparent rounded-full" />
              ) : (
                <GoogleIcon className="h-5 w-5 text-slate-900" />
              )}
              <span className="text-base">Continue with Google</span>
            </Button>
          </div>
          
          <div className="mt-8 text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-slate-500">
            Note: This is a demo authentication for the prototype.
        </div>
      </div>
    </div>
  );
};

export const UpgradeModal: React.FC<{ onClose: () => void, onUpgrade: () => void }> = ({ onClose, onUpgrade }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = () => {
      setIsProcessing(true);
      setTimeout(() => {
          onUpgrade();
          setIsProcessing(false);
          onClose();
      }, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="grid md:grid-cols-2">
          <div className="p-8 bg-slate-900 text-white flex flex-col justify-between">
             <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                    <CrownIcon className="h-5 w-5" /> PREMIUM
                </div>
                <h3 className="text-3xl font-bold mb-4">Unlock Limitless Creativity</h3>
                <ul className="space-y-4 text-slate-300">
                    <li className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</div>
                        Unlimited Generations
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</div>
                        High-Res Downloads
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</div>
                        Priority Processing
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</div>
                        Commercial License
                    </li>
                </ul>
             </div>
             <div className="mt-8">
                 <div className="text-sm text-slate-400">Trusted by 10,000+ SMMEs</div>
             </div>
          </div>
          
          <div className="p-8 bg-white flex flex-col justify-center">
             <div className="text-center mb-8">
                 <h4 className="text-lg font-semibold text-slate-900">Choose Your Plan</h4>
                 <p className="text-slate-500 text-sm">Cancel anytime.</p>
             </div>

             <div className="space-y-4">
                 <div className="border-2 border-primary bg-primary/5 rounded-xl p-4 relative cursor-pointer hover:shadow-md transition-shadow">
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                         MOST POPULAR
                     </div>
                     <div className="flex justify-between items-center">
                         <div className="font-bold text-slate-900">Pro Monthly</div>
                         <div className="text-xl font-bold text-primary">$29<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                     </div>
                 </div>
                 <div className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all opacity-60">
                     <div className="flex justify-between items-center">
                         <div className="font-semibold text-slate-700">Starter Pack</div>
                         <div className="text-xl font-bold text-slate-700">$9<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                     </div>
                 </div>
             </div>

             <div className="mt-8 space-y-3">
                 <Button onClick={handleUpgrade} className="w-full h-12 text-lg" disabled={isProcessing}>
                     {isProcessing ? 'Processing...' : 'Upgrade Now'}
                 </Button>
                 <Button onClick={onClose} variant="ghost" className="w-full" disabled={isProcessing}>
                     No thanks, I'll stick to free
                 </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
