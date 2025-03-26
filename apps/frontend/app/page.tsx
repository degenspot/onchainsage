"use client";
// Removing the unused Image import
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SplineSceneWithImage } from "@/components/SplineSceneWithImage";
import NeuButton from "@/components/NeuButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-1.5 rounded-full text-sm font-medium border border-indigo-100 shadow-sm">
              <svg
                className="h-4 w-4 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L3 7L12 12L21 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 17L12 22L21 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 12L12 17L21 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                Introducing OnChain Sage
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              AI-Powered Crypto Trading Signals
            </h1>
            <p className="text-lg text-gray-600">
              Leverage AI and blockchain technologies to analyze crypto trends.
              Monitor social media sentiment and on-chain metrics for reliable
              trading signals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-gray-900 text-white px-7 py-3.5 rounded-lg font-medium transition-all duration-300 hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 group relative overflow-hidden"
              >
                <span className="absolute inset-0 w-0 bg-indigo-500/20 transition-all duration-500 ease-out group-hover:w-full"></span>
                <span className="relative flex items-center">
                  Try Dashboard Demo
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <NeuButton href="/learn-more">
                Learn More <ArrowRight className="h-4 w-4" />
              </NeuButton>
            </div>
          </div>
          <div className="flex justify-center">
            {/* Replace the Image component with the SplineSceneWithImage component */}
            <div className="w-full max-w-md aspect-square">
              <SplineSceneWithImage
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
                objectName="Plane" // Replace with the actual object name from your Spline scene
                useOwlImage={true} // Use the owl image instead of a custom image URL
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
