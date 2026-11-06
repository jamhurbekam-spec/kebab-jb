import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Minimize2, RefreshCw, Coffee, Flame, BookOpen, Download } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  businessName: string;
  onOpenBagiKopi?: () => void;
  onOpenGuide?: () => void;
  onOpenInstall?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, businessName, onOpenBagiKopi, onOpenGuide, onOpenInstall }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [batteryLevel] = useState<number>(95);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-start p-0 md:py-4 select-none">
      {/* Top Controller Bar (Desktop/Tablet Only) */}
      <div className="w-full max-w-md hidden md:flex items-center justify-between px-3 py-1.5 mb-2 bg-stone-800 text-stone-300 rounded-lg text-xs shadow-md">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-white tracking-wide">KebabKu Android Simulator</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className="text-[11px] text-stone-400">{isOnline ? 'Tersambung (Online)' : 'Offline (Tersimpan Lokal)'}</span>
          </div>
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1 bg-stone-700 hover:bg-stone-600 text-stone-200 px-2 py-0.5 rounded text-xs transition"
            title="Ubah Mode Tampilan"
          >
            {isPhoneFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Layar Penuh</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Mode HP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Android Phone Mockup Container */}
      <div
        className={`w-full bg-stone-100 flex flex-col overflow-hidden transition-all duration-300 relative shadow-2xl ${
          isPhoneFrame
            ? 'max-w-[440px] md:rounded-[42px] md:border-[10px] md:border-stone-800 md:ring-1 md:ring-stone-700/60 min-h-screen md:min-h-[860px] md:max-h-[920px]'
            : 'max-w-4xl min-h-screen rounded-none md:rounded-2xl'
        }`}
      >
        {/* Android Punch Hole Camera (In Phone Frame Mode) */}
        {isPhoneFrame && (
          <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 pointer-events-none ring-2 ring-stone-900/80"></div>
        )}

        {/* Android Native Status Bar */}
        <div className="w-full bg-[#7F1D1D] text-white/90 px-4 pt-2 pb-1 flex items-center justify-between text-xs font-medium z-40 select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[11px] tracking-tight">{currentTime || '12:00'}</span>
            {!isOnline && (
              <span className="bg-amber-400 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[9px]">
                OFFLINE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-white/85">
            <span className="text-[10px] font-sans font-bold tracking-wider">4G</span>
            <Wifi className="w-3 h-3" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">{batteryLevel}%</span>
              <Battery className="w-3.5 h-3.5 fill-white/80" />
            </div>
          </div>
        </div>

        {/* Top App Header with Small Bagi Kopi Logo */}
        <div className="w-full bg-[#7F1D1D] text-white px-4 pb-2.5 pt-0.5 flex items-center justify-between z-40 select-none shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shadow-2xs">
              <Flame className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block leading-none">
                {businessName || 'KebabKu'}
              </span>
              <span className="text-[9px] text-amber-200/80 font-medium">Pengelolaan Usaha Kebab</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Install App Button */}
            {onOpenInstall && (
              <button
                onClick={onOpenInstall}
                className="flex items-center gap-1 bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 font-bold text-[10px] px-2.5 py-1.5 rounded-full transition cursor-pointer active:scale-95"
                title="Pasang Aplikasi KebabKu di Layar HP"
              >
                <Download className="w-3 h-3 text-amber-300" />
                <span>Install</span>
              </button>
            )}

            {/* Panduan Button */}
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-full transition cursor-pointer active:scale-95 border border-white/20"
              title="Buka Panduan & Rumus Laba Rugi"
            >
              <BookOpen className="w-3 h-3 text-amber-300" />
              <span>Panduan</span>
            </button>

            {/* Small Top Coffee Button */}
            <button
              onClick={onOpenBagiKopi}
              className="flex items-center gap-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 text-stone-950 font-black text-[10px] px-2.5 py-1.5 rounded-full shadow-sm active:scale-95 transition cursor-pointer"
              title="Bagi Kopi ke GoPay Jamhur"
            >
              <Coffee className="w-3 h-3 text-stone-900" />
              <span>Bagi Kopi</span>
            </button>
          </div>
        </div>

        {/* Dynamic App Content Body */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-stone-50 pb-20 relative">
          {children}
        </div>

        {/* Android Virtual Gesture Pill / Home Bar */}
        <div className="w-full bg-white/90 backdrop-blur-md border-t border-stone-200/80 py-1 flex items-center justify-center z-40">
          <div className="w-28 h-1 bg-stone-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
