"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import FloatingPlayer from './FloatingPlayer';
import GlobalToolbox from './GlobalToolbox';
import CyberCat from './CyberCat';
import ClickEffect from './ClickEffect';
import MobileBackButton from './MobileBackButton';
import DanmakuBackground from './DanmakuBackground';
import BackgroundEffects from './BackgroundEffects';

export default function ClientDecorations() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  // Pause animations when page is not visible to save resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.documentElement.classList.add('page-hidden');
        console.log('[Performance] Page hidden - animations paused to save resources');
      } else {
        document.documentElement.classList.remove('page-hidden');
        console.log('[Performance] Page visible - animations resumed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Check initial state
    handleVisibilityChange();

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <>
      {!isAdmin && (
        <>
          <div className="hidden md:block"><BackgroundEffects /></div>
          <div className="hidden md:block"><DanmakuBackground /></div>
        </>
      )}

      {!isAdmin && <div className="hidden md:block"><FloatingPlayer /></div>}
      {!isAdmin && <div className="hidden md:block"><GlobalToolbox /></div>}
      {!isAdmin && <div className="md:hidden block"><MobileBackButton /></div>}
      {!isAdmin && <div className="hidden md:block"><ClickEffect /></div>}
      {!isAdmin && <div className="hidden md:block"><CyberCat /></div>}
    </>
  );
}
