<<<<<<< HEAD
"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import StarknetLogin from "./StarknetLogin"
import { Menu, X, LogIn, ArrowRight, Wallet, Lightbulb, Compass } from "lucide-react"
import PearlButton from "./PearlButton"

const Navbar = () => {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Function to handle smooth scrolling
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav
      className={`${
        isLandingPage ? "bg-white text-gray-900" : "bg-transparent text-white"
      } p-4 shadow-sm border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            OnChain Sage
          </Link>
        </div>

        {/* Desktop Navigation - centered for landing page */}
        {isLandingPage && (
          <div className="hidden sm:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-8">
            <Link
              href="/features"
              className="hover:text-gray-600 transition-colors font-medium flex items-center gap-1.5 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-gray-600 after:transition-all"
            >
              <Lightbulb className="h-4 w-4" />
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="hover:text-gray-600 transition-colors font-medium flex items-center gap-1.5 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-gray-600 after:transition-all"
            >
              <Compass className="h-4 w-4" />
              How It works
            </Link>
            <button
              onClick={() => scrollToSection("pricing")}
              className="hover:text-gray-600 transition-colors font-medium flex items-center gap-1.5 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-gray-600 after:transition-all"
            >
              <Wallet className="h-4 w-4" />
              Pricing
            </button>
          </div>
        )}

        {/* Right side buttons/login */}
        {isLandingPage ? (
          <div className="hidden sm:flex items-center space-x-4">
            <Link
              href="/login"
              className="hover:text-gray-600 transition-colors flex items-center gap-1.5 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-gray-600 after:transition-all"
            >
              Login
              <LogIn className="h-4 w-4" />
            </Link>
            <PearlButton href="/get-started">
              Get Started <ArrowRight className="h-4 w-4 ml-2" />
            </PearlButton>
          </div>
        ) : (
          <div className="hidden sm:flex items-center space-x-4">
            <StarknetLogin />
          </div>
        )}

        {/* Hamburger menu button for mobile (phones only) */}
        <div className="sm:hidden">
          <button onClick={toggleMenu} className="p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && isLandingPage && (
        <div className="sm:hidden pt-4 pb-2 space-y-3">
          <Link
            href="/features"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Lightbulb className="h-4 w-4" />
            Features
          </Link>
          <Link
            href="/how-it-works"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Compass className="h-4 w-4" />
            How It Works
          </Link>
          <button
            onClick={() => {
              scrollToSection("pricing")
              toggleMenu() // Close menu after clicking
            }}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors w-full text-left"
          >
            <Wallet className="h-4 w-4" />
            Pricing
          </button>
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            Login
            <LogIn className="h-4 w-4" />
          </Link>
          <div className="px-4">
            <PearlButton href="/get-started">
              Get Started <ArrowRight className="h-4 w-4 ml-2" />
            </PearlButton>
          </div>
        </div>
      )}

      {isMenuOpen && !isLandingPage && (
        <div className="sm:hidden pt-4 pb-2">
          <StarknetLogin />
        </div>
      )}
    </nav>
  )
}

export default Navbar

=======
import React from 'react';
import { Menu, Bell, Settings } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold">OnChain Sage</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-800 rounded-full">
            <Bell size={20} />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-full">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
>>>>>>> ec10c23ed1972727715baded9e973861b0de1483
