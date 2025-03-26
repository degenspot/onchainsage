import PricingHeader from "../../components/pricing/pricing-header"
import PricingCards from "../../components/pricing/pricing-cards"
import PricingFooter from "../../components/pricing/pricing-footer"

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 md:px-6 lg:px-8 bg-black text-white">
      <PricingHeader />
      <PricingCards />
      <PricingFooter />
    </div>
  )
}

