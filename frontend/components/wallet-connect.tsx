"use client"

import { useState } from "react"
import { Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = () => {
    setIsConnected(true)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
  }

  return (
    <Card className="transition-all-200 hover:border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Starknet Wallet</CardTitle>
        <CardDescription className="text-xs">
          {isConnected ? "Connected to Starknet" : "Connect your wallet to access premium features"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {isConnected ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Address</span>
              <span className="text-xs font-medium">0x71C...F3E2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="text-xs font-medium">125.5 STRK</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2">
            <Wallet className="h-8 w-8 text-muted-foreground transition-all-200 animate-pulse" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full transition-all-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full transition-all-200 hover:shadow-md hover:shadow-primary/20"
            onClick={handleConnect}
          >
            Connect Wallet
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

