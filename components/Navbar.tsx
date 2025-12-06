import React from 'react';
import { ViewState } from '../types';
import { Calendar } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  onChange: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onChange }) => {
  return (
    <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-2 h-20 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-center items-center h-full pb-2">
        <button 
          className={`flex flex-col items-center justify-center transition-colors duration-300 ${currentView === 'plan' ? 'text-muji-text' : 'text-muji-subtext'}`} 
          onClick={() => onChange('plan')}
        >
          <Calendar className="w-6 h-6 mb-1" strokeWidth={currentView === 'plan' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide uppercase">Plan</span>
        </button>
      </div>
    </nav>
  );
};