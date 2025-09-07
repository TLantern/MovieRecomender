import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700"], // Bold for headlines
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400"], // Light and Regular
});

export const metadata: Metadata = {
  title: "YScenes - AI-Powered Movie Recommendations",
  description: "Discover your next favorite movie with AI-powered recommendations based on your mood. Get personalized film suggestions in seconds.",
  keywords: ["movies", "recommendations", "AI", "film", "entertainment", "streaming"],
  authors: [{ name: "YScenes" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          footer: "hidden"
        }
      }}
    >
      <html lang="en">
        <head>
          {/* DNS prefetch for external services */}
          <link rel="dns-prefetch" href="//api.themoviedb.org" />
          <link rel="dns-prefetch" href="//image.tmdb.org" />
          <link rel="dns-prefetch" href="//images.unsplash.com" />
          <link rel="dns-prefetch" href="//api.openai.com" />
          
          {/* Preconnect to critical external domains */}
          <link rel="preconnect" href="https://api.themoviedb.org" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
          
          {/* Preload critical background image */}
          <link rel="preload" href="/background.jpeg" as="image" />
          
          {/* Resource hints for performance */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        </head>
        <body
          className={`${montserrat.variable} ${inter.variable} antialiased relative`}
          style={{
            backgroundImage: 'url(/background.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            minHeight: '100vh'
          }}
        >
          <div 
            className="fixed inset-0 bg-black/40 pointer-events-none z-0"
            style={{ zIndex: 0 }}
          ></div>
          <div className="relative z-10">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
