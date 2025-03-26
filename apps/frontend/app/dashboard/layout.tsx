"use client";
import React from "react";
import Sidebar from "@/components/Layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* <Sidebar /> */}
      <main className="flex-1 ml-0 lg:ml-16">{children}</main>
    </div>
  );
}
