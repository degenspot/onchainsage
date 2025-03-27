"use client"

import { Check, X } from "lucide-react"
import { Button } from "../../components/ui/button"
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

interface PricingCardProps {
  plan: PricingPlan
  isActive: boolean
  onClick: () => void
}

export default function PricingCard({ plan, isActive, onClick }: PricingCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col p-6 bg-white text-black border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
        isActive ? "border-2 border-black shadow-lg" : "border border-gray-200",
        plan.popular && !isActive && "relative", // Only add relative positioning when not active
        plan.popular && isActive && "relative", // Keep relative positioning when active for the badge
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 right-6 px-3 py-1 bg-black text-white text-sm font-medium rounded">Popular</div>
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
        <Button variant={plan.buttonVariant} className="w-full py-6">
          {plan.buttonText}
        </Button>
      </div>
    </div>
  )
}

