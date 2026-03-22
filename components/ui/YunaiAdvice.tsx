import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, RefreshCw, X } from 'lucide-react';

interface YunaiAdviceProps {
  advice?: string;
  isLoading: boolean;
  onRefresh: () => void;
  userName?: string;
}

const YunaiAdvice: React.FC<YunaiAdviceProps> = ({ 
  advice, 
  isLoading, 
  onRefresh, 
  userName = 'Amigo' 
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isLoading) setShowAnimation(true);
    else {
      const timer = setTimeout(() => setShowAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!advice && !isLoading) return null;

  return (
    <div className="relative mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Yunai Persona Container */}
      <div className="flex items-start gap-4">
        {/* Yunai Avatar Circle */}
        <div className="relative flex-shrink-0 mt-2">
          <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-yn-primary-500/30 shadow-lg ${showAnimation ? 'animate-bounce' : ''}`}>
            <img src="/logos/Mascota_Yunai.svg" alt="Yunai" className="w-full h-full object-cover object-top" />
          </div>
          {isLoading && (
            <div className="absolute -top-1 -right-1">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center animate-spin shadow-sm">
                <RefreshCw size={10} className="text-yn-primary-600" />
              </div>
            </div>
          )}
        </div>

        {/* Speech Bubble */}
        <div className="flex-grow">
          <div className="bg-white dark:bg-yn-neutral-800 rounded-2xl rounded-tl-none p-4 shadow-md border border-yn-neutral-100 dark:border-yn-neutral-700 relative">
            {/* Bubble arrow tip */}
            <div className="absolute top-0 -left-2 w-0 h-0 border-t-[0px] border-t-transparent border-r-[8px] border-r-white dark:border-r-yn-neutral-800 border-b-[8px] border-b-transparent"></div>
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-yn-primary-600 dark:text-yn-primary-400 uppercase tracking-wider">Consejo de Yunai</span>
                <Sparkles size={12} className="text-yellow-500 animate-pulse" />
              </div>
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="text-yn-neutral-400 hover:text-yn-primary-600 transition-colors"
                title="Nuevo consejo"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-yn-neutral-100 dark:bg-yn-neutral-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-yn-neutral-100 dark:bg-yn-neutral-700 rounded w-1/2 animate-pulse"></div>
              </div>
            ) : (
              <p className="text-yn-neutral-700 dark:text-yn-neutral-200 text-sm leading-relaxed italic">
                "{advice}"
              </p>
            )}
            
            {!isLoading && (
              <div className="mt-2 flex justify-end">
                <div className="text-[10px] text-yn-neutral-400 flex items-center gap-1">
                  <MessageCircle size={10} />
                  Perspectiva de IA basada en tus datos
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YunaiAdvice;
