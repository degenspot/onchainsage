"use client";
import React from "react";
import Link from "next/link";
import "./PearlButton.css";

interface PearlButtonProps {
  href: string;
  children: React.ReactNode;
}

const PearlButton = ({ href, children }: PearlButtonProps) => {
  return (
    <Link href={href} className="pearl-button-link">
      <button className="button">
        <div className="wrap">
          <p>
            <span>✧</span>
            <span>✦</span>
            {children}
          </p>
        </div>
      </button>
    </Link>
  );
};

export default PearlButton;
