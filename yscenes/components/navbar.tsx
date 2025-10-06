'use client';

import { useState } from 'react';
import { useSearchLimit } from '../hooks/useSearchLimit';
import Link from 'next/link';
import Image from 'next/image';
import { SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

interface NavbarProps {
  searchCount?: number;
  isVipUser?: boolean;
  canSearch?: boolean;
}

export default function Navbar({ searchCount = 0, isVipUser = false, canSearch = true }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isVipUser: hookIsVipUser, searchCount: hookSearchCount } = useSearchLimit();
  const vip = isVipUser || hookIsVipUser;
  const count = searchCount ?? hookSearchCount;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo/Brand - Absolute positioned to not affect layout */}
          <div className="absolute left-4 sm:left-6 lg:left-8">
            <Link href="/" aria-label="YScenes"
              className="group inline-flex items-center overflow-hidden rounded-full bg-black/70 backdrop-blur [--size:48px] [--pad:6px] [--gap:10px] px-[var(--pad)] py-[var(--pad)] w-[calc(var(--size)+var(--pad)*2)] transition-[width] duration-300 ease-out focus-visible:outline-none hover:w-max focus-visible:w-max">
              <Image
                src="/movie.png"
                alt="YScenes"
                width={38}
                height={38}
                className="rounded-full w-[var(--size)] h-[var(--size)] shrink-0 transition-transform duration-700 ease-in-out group-hover:rotate-360 mt-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              />
              <span className="whitespace-nowrap text-white font-semibold text-xl translate-x-3 opacity-0 transition duration-600 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ml-[var(--gap)] relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-300 group-hover:after:w-full group-focus-visible:after:w-full font-heading">
                YScenes
              </span>
            </Link>
          </div>



          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex flex-1 justify-center items-center">
            <div className="flex items-baseline space-x-8">
              <Link 
                href="/" 
                className="text-white font-semibold px-3 py-2 rounded-md text-sm relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                Home
              </Link>
              <Link 
                href="/movies" 
                className="text-white font-semibold px-3 py-2 rounded-md text-sm relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                Movies
              </Link>
              <Link 
                href="/bookmarks" 
                className="text-white font-semibold px-3 py-2 rounded-md text-sm relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                Bookmarks
              </Link>
              <Link 
                href="/pricing" 
                className="text-white font-semibold px-3 py-2 rounded-md text-sm relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Authentication Buttons - Right side */}
          <div className="absolute right-4 sm:right-6 lg:right-8 flex items-center space-x-3">
            {/* Search Limit Indicator */}
            {!vip && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/30">
                <div className="text-center">
                  <div className="text-purple-300 text-xs font-medium">
                    {count === 0 ? '🎬 1 Free' : 
                     count === 1 ? '⚠️ Used' : 
                     '🔒 Upgrade'}
                  </div>
                </div>
              </div>
            )}

            {/* VIP User Indicator */}
            {vip && (
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/50">
                <div className="text-center">
                  <div className="text-purple-300 text-xs font-medium">
                    ♾️ Unlimited
                  </div>
                </div>
              </div>
            )}

            <SignedOut>
              <div className="flex items-center space-x-3">
                {/* Sign Up Button */}
                <SignUpButton mode="modal" fallbackRedirectUrl="/upgrade">
                  <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 font-medium">
                    Sign Up
                  </button>
                </SignUpButton>
                
                {/* Google Sign In Button */}
                <SignUpButton mode="modal" fallbackRedirectUrl="/upgrade">
                  <button className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                    <Image
                      src="/google.png"
                      alt="Google"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span>Google</span>
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            
            <SignedIn>
              <div className="mt-4 relative">
                {/* Glow effect behind avatar */}
                <div className="absolute inset-0 w-12 h-12 bg-white/30 rounded-full blur-md scale-110"></div>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-12 h-12 !w-12 !h-12 relative z-10",
                      userButtonPopoverCard: "bg-black/90 backdrop-blur-sm border border-white/30"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>



          {/* Mobile menu button - Right side */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-blue-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/80 backdrop-blur-md">
          <Link 
            href="/" 
            className="text-white font-semibold block px-3 py-2 rounded-md text-base relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/movies" 
            className="text-white font-semibold block px-3 py-2 rounded-md text-base relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            Movies
          </Link>
          <Link 
            href="/bookmarks" 
            className="text-white font-semibold block px-3 py-2 rounded-md text-base relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            Bookmarks
          </Link>
          <Link 
            href="/pricing" 
            className="text-white font-semibold block px-3 py-2 rounded-md text-base relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link 
            href="/about" 
            className="text-white font-semibold block px-3 py-2 rounded-md text-base relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
} 