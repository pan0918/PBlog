import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import { MusicProvider } from "../components/MusicProvider";
import FloatingPlayer from "../components/FloatingPlayer";
import { siteConfig } from "../siteConfig";
import ClickEffect from "../components/ClickEffect";
import BackgroundSlider from "../components/BackgroundSlider";
import GlobalToolbox from "../components/GlobalToolbox";
import SplashScreen from "../components/SplashScreen";
import CyberCat from '../components/CyberCat';
import DanmakuBackground from '../components/DanmakuBackground';
import MobileBackButton from '../components/MobileBackButton';

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: { icon: siteConfig.faviconUrl, apple: siteConfig.faviconUrl },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Set the theme class before first paint to avoid flash — WITHOUT hiding the whole app */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('blog-theme');var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}}catch(e){document.documentElement.classList.remove('dark');}})();`,
          }}
        />
      </head>
      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-300 font-serif">
        <ThemeProvider>
          <SplashScreen />
          <MusicProvider>
            <div id="app-mount-root" className="flex-1 flex flex-col warm-page-surface">
              <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                {!siteConfig.useGradient && <BackgroundSlider />}
                <div className="absolute inset-0 z-[-9] bg-[#fff8f1]/70 dark:bg-stone-950/35 backdrop-blur-md transition-colors duration-300"></div>
                <div className="absolute inset-0 z-[-8] opacity-55 dark:opacity-10 transition-opacity duration-300 transform-gpu" style={{ background: `linear-gradient(-45deg, ${siteConfig.themeColors.join(', ')})`, backgroundSize: '400% 400%', animation: 'gradientMove 18s ease infinite' }}></div>
                <div className="absolute top-[-12%] left-[-10%] w-[44%] h-[44%] bg-white/55 dark:bg-amber-900/10 blur-[110px] rounded-full z-[-7]"></div>
                <div className="absolute bottom-[-12%] right-[-10%] w-[44%] h-[44%] bg-[#f0cdb0]/28 dark:bg-orange-900/10 blur-[120px] rounded-full z-[-7]"></div>
                <div className="hidden md:block absolute inset-0 w-full h-full"><BackgroundEffects /></div>
              </div>
              <div className="hidden md:block"><DanmakuBackground /></div>
              <div className="relative z-10 flex-1 flex flex-col">{children}</div>
              <div className="hidden md:block"><FloatingPlayer /></div>
              <div className="hidden md:block"><GlobalToolbox /></div>
              <div className="md:hidden block"><MobileBackButton /></div>
              <div className="hidden md:block"><ClickEffect /></div>
            </div>
            <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }` }} />
          </MusicProvider>
          <div className="hidden md:block"><CyberCat /></div>
        </ThemeProvider>
      </body>
    </html>
  );
}
