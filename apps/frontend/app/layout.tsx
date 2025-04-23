<<<<<<< HEAD
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Layout/Navbar";
import { StarknetProvider } from "@/context/StarknetContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "OnChain Sage",
  description: "AI-driven decentralized trading assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StarknetProvider>
          <div className="min-h-screen">
            {/* <Navbar /> */}
            {children}
          </div>
        </StarknetProvider>
      </body>
    </html>
  );
}
=======
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import { StarknetProvider } from "@/context/StarknetContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "OnChain Sage",
  description: "AI-driven decentralized trading assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StarknetProvider>
          <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 ml-64 p-6">{children}</main>
            </div>
          </div>
        </StarknetProvider>
      </body>
    </html>
  );
}
>>>>>>> ec10c23ed1972727715baded9e973861b0de1483
