"use client"

import { useState } from "react"
import {
  Bell,
  ChevronDown,
  Coins,
  Filter,
  LineChart,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  User,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardChart } from "@/components/dashboard-chart"
import { SignalTable } from "@/components/signal-table"
import { TrendingTokens } from "@/components/trending-tokens"
import { WalletConnect } from "@/components/wallet-connect"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Dashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background dark">
        <Sidebar className="border-r">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <Coins className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">OnChain Sage</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { icon: LineChart, label: "Dashboard", active: true },
                    { icon: Coins, label: "Signals" },
                    { icon: MessageSquare, label: "Social Sentiment" },
                    { icon: Wallet, label: "Wallet" },
                    { icon: Settings, label: "Settings" },
                  ].map((item, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton isActive={item.active}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-4">
              <WalletConnect />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <header className="flex h-16 min-h-[4rem] items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 shrink-0">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button className="h-9 w-9 p-0 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button 
                className="h-9 w-9 p-0 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                onClick={toggleTheme}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-8 gap-2 rounded-md border border-input bg-background px-3 text-xs shadow-sm hover:bg-accent hover:text-accent-foreground">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline-flex">John Doe</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 w-full h-[calc(100vh-4rem)] overflow-auto p-4 md:p-6">
            <div className="grid gap-4 md:gap-6 w-full">
              {/* Overview Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[
                  { title: "Total Signals", value: "142", change: "+22%" },
                  { title: "High Confidence", value: "36", change: "+12%" },
                  { title: "Emerging Trends", value: "89", change: "+18%" },
                  { title: "Risky Signals", value: "17", change: "-5%" },
                ].map((card, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{card.value}</div>
                      <p className={`text-xs ${card.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                        {card.change} from last month
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts and Tables */}
              <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Market Overview</CardTitle>
                    <CardDescription>Price and volume trends for the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DashboardChart />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Trending Tokens</CardTitle>
                    <CardDescription>Based on social sentiment and on-chain activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TrendingTokens />
                  </CardContent>
                </Card>
              </div>

              {/* Trading Signals */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Trading Signals</CardTitle>
                    <CardDescription>Recent trading signals based on AI analysis</CardDescription>
                  </div>
                  <Button className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4 w-full justify-start overflow-auto">
                      <TabsTrigger value="all">All Signals</TabsTrigger>
                      <TabsTrigger value="high">High Confidence</TabsTrigger>
                      <TabsTrigger value="emerging">Emerging</TabsTrigger>
                      <TabsTrigger value="risky">Risky</TabsTrigger>
                    </TabsList>
                    <div className="overflow-auto">
                      <TabsContent value="all">
                        <SignalTable />
                      </TabsContent>
                      <TabsContent value="high">
                        <SignalTable category="high" />
                      </TabsContent>
                      <TabsContent value="emerging">
                        <SignalTable category="emerging" />
                      </TabsContent>
                      <TabsContent value="risky">
                        <SignalTable category="risky" />
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between flex-wrap gap-4">
                  <Button className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">Previous</Button>
                  <Button className="bg-primary text-primary-foreground shadow hover:bg-primary/90">Next</Button>
                </CardFooter>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

