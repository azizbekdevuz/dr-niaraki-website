import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      {" "}
      {/* Correct capitalization */}
      <Head>
        {/* Preload fonts */}
        <link
          rel="preload"
          href="/fonts/GeistVF.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeistMonoVF.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Meta tags for SEO */}
        <meta
          name="description"
          content="Dr. Abolghasem Niaraki-Sadeghi - Expertise in IT, XR, AR, and AI"
        />
        <meta property="og:title" content="Dr. Abolghasem Niaraki-Sadeghi" />
        <meta
          property="og:description"
          content="Explore research, teaching, and professional experience in technology."
        />
        <meta property="og:image" content="/assets/images/og-image.jpg" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}