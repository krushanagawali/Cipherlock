import React from 'react';
import { Shield, ShieldPlus, Smartphone, FileSpreadsheet, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  vaultCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  vaultCount,
}) => {
  const navItems = [
    {
      id: 'vault' as TabType,
      label: 'Vault',
      icon: Shield,
      badge: vaultCount,
    },
    {
      id: 'command_center' as TabType,
      label: 'AI SecOps',
      icon: Sparkles,
      highlightPill: 'Gemini 3.8',
    },
    {
      id: 'shield' as TabType,
      label: 'Shield File',
      icon: ShieldPlus,
      isPrimaryAction: true,
    },
    {
      id: 'verify' as TabType,
      label: 'Verify SIM',
      icon: Smartphone,
    },
    {
      id: 'audit' as TabType,
      label: 'Audit Log',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <>
      {/* Desktop Secondary Sub-Nav Bar with Google style */}
      <div className="hidden md:block w-full bg-slate-100/90 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center space-x-1 sm:space-x-1.5 py-2 shrink-0">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-[0_2px_10px_rgba(37,99,235,0.3)]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : item.id === 'command_center' ? 'text-blue-500' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.highlightPill && !isActive && (
                    <span className="hidden lg:inline ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 font-mono">
                      {item.highlightPill}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-500 font-medium shrink-0 ml-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GOOGLE TITAN M2 ENCLAVE: ARMED</span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1 max-w-lg mx-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if (item.isPrimaryAction) {
              return (
                <button
                  key={item.id}
                  id={`nav-mobile-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)] scale-105'
                        : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_2px_10px_rgba(37,99,235,0.3)]'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 tracking-tight ${
                      isActive ? 'text-blue-600' : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 relative transition-colors duration-150 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-mono font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'command_center' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className={`text-[10px] font-medium mt-1 tracking-tight truncate max-w-[58px] ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

