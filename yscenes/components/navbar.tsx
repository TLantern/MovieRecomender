'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                Home
              </Link>
              <Link 
                href="/movies" 
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                Movies
              </Link>
              <Link 
                href="/recommendations" 
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                Recommendations
              </Link>
              <Link 
                href="/about" 
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              >
                About
              </Link>
            </div>
          </div>

          {/* Clerk Authentication Buttons - Right side */}
          <div className="absolute right-20 sm:right-24 lg:right-28">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center overflow-hidden rounded-full bg-black/70 backdrop-blur [--size:48px] [--pad:6px] [--gap:10px] px-[var(--pad)] py-[var(--pad)] w-[calc(var(--size)+var(--pad)*2)] transition-[width] duration-300 ease-out focus-visible:outline-none hover:w-max focus-visible:w-max">
                  <svg className="w-[var(--size)] h-[var(--size)] shrink-0 transition-transform duration-700 ease-in-out group-hover:rotate-360 mt-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="whitespace-nowrap text-white font-semibold text-xl translate-x-3 opacity-0 transition duration-600 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ml-[var(--gap)] relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-300 group-hover:after:w-full group-focus-visible:after:w-full font-heading">
                    Sign Up
                  </span>
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "bg-black/90 backdrop-blur-sm border border-white/30"
                  }
                }}
              />
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
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/movies" 
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            Movies
          </Link>
          <Link 
            href="/recommendations" 
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            Recommendations
          </Link>
          <Link 
            href="/about" 
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
} 