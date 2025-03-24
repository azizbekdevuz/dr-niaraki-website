import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import "../styles/atomcursor.css";
import "../styles/scrollbar.css";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Chatbot from "@/components/Chatbot";
import { AnimatePresence } from "framer-motion";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

function MyApp({ Component, pageProps, router }: AppProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    const handleRouteChange = () => window.scrollTo(0, 0);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!mounted) return null;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div
        className={`
        min-h-screen 
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} 
        transition-colors duration-300
      `}
      >
        <Head>
          <title>Dr. Abolghasem Sadeghi-Niaraki</title>
          <meta
            name="description"
            content="Research Portfolio of Dr. Abolghasem Sadeghi-Niaraki"
          />
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        <main className="pt-20">
          <AnimatePresence mode="wait">
            <Component {...pageProps} key={router.route} darkMode={darkMode} />
            <Chatbot />
          </AnimatePresence>
        </main>

        <SpeedInsights />
        <Analytics />
      </div>
    </ThemeProvider>
  );
}

export default MyApp;