"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface PricingFeature {
  name: string
  included: boolean
}

interface PricingPlan {
  name: string
  description: string
  price: string
  popular: boolean
  features: PricingFeature[]
  buttonText: string
  buttonVariant: "default" | "outline"
}

export default function PricingSection() {
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
    <section id="pricing" className="text-black bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-400">
            Flexible pricing options designed to fit your trading needs, from beginners to professional traders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              onClick={() => handleCardClick(plan.name)}
              className={cn(
                "flex flex-col p-6 bg-white text-black border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                activePlan === plan.name ? "border-2 border-black shadow-lg" : "border border-gray-200",
                plan.popular && activePlan !== plan.name && "relative",
                plan.popular && activePlan === plan.name && "relative",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-6 px-3 py-1 bg-black text-white text-sm font-medium rounded">
                  Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-gray-500 mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mr-2 shrink-0" />
                    )}
                    <span className="text-gray-700">{feature.name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button variant={plan.buttonVariant === "default" ? "default" : "outline"} className="w-full py-6">
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center w-full max-w-3xl mx-auto">
          <p className="text-gray-400 pb-4 border-b border-gray-700">
            All plans include a 7-day free trial. No credit card required to start.
          </p>
        </div>
      </div>
    </section>
  )
}

