'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo/Brand - Absolute positioned to not affect layout */}
          <div className="absolute left-4 sm:left-6 lg:left-8">
            <Link href="/" aria-label="YScenes"
              className="group inline-flex items-center overflow-hidden rounded-full bg-black/70 backdrop-blur [--size:48px] [--pad:6px] [--gap:10px] px-[var(--pad)] py-[var(--pad)] w-[calc(var(--size)+var(--pad)*2)] transition-[width] duration-300 ease-out focus-visible:outline-none hover:w-max focus-visible:w-max">
              <Image
                src="/movie.png"
                alt="YScenes"
                width={48}
                height={48}
                className="rounded-full w-[var(--size)] h-[var(--size)] shrink-0 transition-transform duration-700 ease-in-out group-hover:rotate-360"
              />
              <span className="whitespace-nowrap text-white font-semibold text-xl translate-x-3 opacity-0 transition duration-600 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ml-[var(--gap)] relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-300 group-hover:after:w-full group-focus-visible:after:w-full">
                YScenes
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex flex-1 justify-center items-center">
            <div className="flex items-baseline space-x-8">
              <Link 
                href="/" 
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
              >
                Home
              </Link>
              <Link 
                href="/movies" 
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
              >
                Movies
              </Link>
              <Link 
                href="/recommendations" 
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
              >
                Recommendations
              </Link>
              <Link 
                href="/about" 
                className="text-white/90 px-3 py-2 rounded-md text-sm font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
              >
                About
              </Link>
            </div>
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
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/movies" 
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            Movies
          </Link>
          <Link 
            href="/recommendations" 
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            Recommendations
          </Link>
          <Link 
            href="/about" 
            className="text-white/90 block px-3 py-2 rounded-md text-base font-medium relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 after:delay-100 hover:after:w-full transition-transform duration-200 hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
