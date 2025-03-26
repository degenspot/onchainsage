"use client"

import { useState } from "react"
import PricingCard from "./pricing-card"

export default function PricingCards() {
  // Set "Pro" as the default active plan
  const [activePlan, setActivePlan] = useState<string>("Pro")

  const handleCardClick = (planName: string) => {
    setActivePlan(planName)
  }

  const plans = [
    {
      name: "Free",
      description: "Basic access to get started",
      price: "$0",
      popular: false,
      features: [
        { name: "Limited signal access (delayed by 24h)", included: true },
        { name: "Basic dashboard features", included: true },
        { name: "Public data analysis", included: true },
        { name: "Real-time alerts", included: false },
        { name: "Advanced filtering", included: false },
      ],
      buttonText: "Sign Up Free",
      buttonVariant: "outline" as const,
    },
    {
      name: "Basic",
      description: "For casual crypto traders",
      price: "$29",
      popular: false,
      features: [
        { name: "Real-time signal access", included: true },
        { name: "Full dashboard features", included: true },
        { name: "Basic signal filtering", included: true },
        { name: "Email alerts", included: true },
        { name: "Advanced analytics", included: false },
      ],
      buttonText: "Subscribe Now",
      buttonVariant: "default" as const,
    },
    {
      name: "Pro",
      description: "For serious traders",
      price: "$79",
      popular: true,
      features: [
        { name: "Priority signal access", included: true },
        { name: "Advanced dashboard features", included: true },
        { name: "Advanced signal filtering", included: true },
        { name: "Real-time mobile alerts", included: true },
        { name: "Historical performance data", included: true },
      ],
      buttonText: "Subscribe Now",
      buttonVariant: "default" as const,
    },
    {
      name: "Enterprise",
      description: "For professional trading firms",
      price: "$199",
      popular: false,
      features: [
        { name: "Exclusive early signal access", included: true },
        { name: "Custom dashboard integration", included: true },
        { name: "API access for custom integration", included: true },
        { name: "Priority support", included: true },
        { name: "Custom signal development", included: true },
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mb-16">
      {plans.map((plan) => (
        <PricingCard
          key={plan.name}
          plan={plan}
          isActive={activePlan === plan.name}
          onClick={() => handleCardClick(plan.name)}
        />
      ))}
    </div>
  )
}

