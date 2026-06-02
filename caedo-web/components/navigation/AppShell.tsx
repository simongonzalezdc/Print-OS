'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  LayoutDashboard, 
  Briefcase, 
  Printer, 
  Settings, 
  PieChart, 
  ListTodo,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';

const navItems = [
  { label: 'Studio', icon: Box, path: '/', mode: 'design' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', mode: 'manage' },
  { label: 'Business', icon: Briefcase, path: '/business', mode: 'manage' },
  { label: 'Facility', icon: Printer, path: '/facility', mode: 'manage' },
  { label: 'Inventory', icon: Box, path: '/facility/inventory', mode: 'manage' },
  { label: 'Jobs', icon: ListTodo, path: '/facility/jobs', mode: 'manage' },
  { label: 'Analytics', icon: PieChart, path: '/analytics/profitability', mode: 'manage' },
  { label: 'Settings', icon: Settings, path: '/settings', mode: 'manage' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isDesignMode = pathname === '/';

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] text-foreground overflow-hidden">
      {/* Dynamic Header */}
      <header className="h-14 border-b border-border/50 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-glow">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest leading-none">
              PRINT_OS<span className="text-primary">_V1</span>
            </h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
              {isDesignMode ? 'Parametric Design Studio' : 'Industrial Management Layer'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-primary animate-pulse">SYSTEM_STABLE</span>
            <span className="text-[9px] font-mono opacity-40 uppercase">LATENCY: 14MS // UPTIME: 99.9%</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-primary/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Unified Navigation (Bottom Mission Control) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
        <nav className="floating-dock pointer-events-auto px-2 py-1.5 flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <button
                  title={item.label}
                  className={cn(
                    "relative p-3 rounded-lg transition-all duration-300 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-glow scale-110" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  
                  {/* Tooltip on Hover */}
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-primary/30 px-2 py-1 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-glow">
                    {item.label}
                  </span>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                    />
                  )}
                </button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1000] noise-overlay" />
      
      <ShortcutsModal />
    </div>
  );
};

