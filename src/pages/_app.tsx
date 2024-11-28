import { useEffect } from "react";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import "../styles/atomcursor.css";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { SpeedInsights } from "@vercel/speed-insights/next"

function MyApp({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    // Scroll to top on route change
    const handleRouteChange = () => window.scrollTo(0, 0);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <ThemeProvider attribute="class">
      <AnimatePresence mode="wait">
        <Component {...pageProps} key={router.route} />
      </AnimatePresence>
      <SpeedInsights/>
    </ThemeProvider>
  );
}

export default MyApp;
