"use client";

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
