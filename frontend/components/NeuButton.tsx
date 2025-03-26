"use client";
import React from "react";
import Link from "next/link";
import "./NeuButton.css";

interface NeuButtonProps {
  href: string;
  children: React.ReactNode;
}

const NeuButton = ({ href, children }: NeuButtonProps) => {
  return (
    <Link href={href} className="neu-button-link">
      <button className="neu-button">{children}</button>
    </Link>
  );
};

export default NeuButton;
