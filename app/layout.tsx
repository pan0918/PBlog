import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { MusicProvider } from "../components/MusicProvider";
import { siteConfig } from "../siteConfig";
import BackgroundSlider from "../components/BackgroundSlider";
import SplashScreen from "../components/SplashScreen";
import ClientDecorations from '../components/ClientDecorations';
import { EffectQualityProvider } from "../components/EffectQualityProvider";
import { ToastProvider } from "../components/ToastProvider";
import SiteChrome from "../components/SiteChrome";
import { getPreconnectOrigins, resizeImageUrl } from "../lib/images/cdn";

// The source icon is ~1 MB; browsers only need a small copy.
const faviconUrl = resizeImageUrl(siteConfig.faviconUrl, 64);
const appleIconUrl = resizeImageUrl(siteConfig.faviconUrl, 192);
// Warm up DNS + TLS for the media domain so the first image / song starts sooner.
const preconnectOrigins = getPreconnectOrigins();

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: { icon: faviconUrl, apple: appleIconUrl },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {preconnectOrigins.map((origin) => <link key={origin} rel="preconnect" href={origin} />)}
        {/* The audio element uses crossOrigin="anonymous", which needs its own connection. */}
        {preconnectOrigins.map((origin) => <link key={`${origin}-cors`} rel="preconnect" href={origin} crossOrigin="anonymous" />)}
        {/* Set the theme class before first paint to avoid flash — WITHOUT hiding the whole app */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('blog-theme');var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}}catch(e){document.documentElement.classList.remove('dark');}})();`,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;var q=r?'static':(window.innerWidth<768||(navigator.hardwareConcurrency||4)<=4?'low':'high');d.classList.remove('effects-high','effects-low','effects-static','effects-paused');d.classList.add('effects-'+q);if(document.hidden)d.classList.add('effects-paused');})();`,
          }}
        />
      </head>
      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-300 font-serif warm-page-surface">
        <ThemeProvider>
          <EffectQualityProvider>
            <SplashScreen />
            <MusicProvider>
              <div id="app-mount-root" className="flex-1 flex flex-col min-h-screen">
                <div className="effect-layer fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                  {!siteConfig.useGradient && <BackgroundSlider />}
                  <div className="absolute inset-0 z-[-9] bg-[#fff8f1]/70 dark:bg-stone-950/35 transition-colors duration-300"></div>
                  <div className="site-gradient-layer" style={{ background: `linear-gradient(-45deg, ${siteConfig.themeColors.join(', ')})` }} />
                  <div className="site-ambient-glow" />
                </div>
                <ClientDecorations />

                <ToastProvider>
                  <SiteChrome />
                  <div className="relative z-10 flex-1 flex flex-col">{children}</div>
                </ToastProvider>
              </div>
            </MusicProvider>
          </EffectQualityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
