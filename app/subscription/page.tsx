"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Check,
  X,
  Zap,
  Crown,
  Heart,
  Globe,
  Users,
  Camera,
  Filter,
  Star,
  Sparkles,
  Timer,
  Infinity,
} from "lucide-react"
import Link from "next/link"

interface PlanFeature {
  name: string
  free: boolean | string
  boost: boolean | string
  vip: boolean | string
  icon?: React.ComponentType<{ className?: string }>
}

const features: PlanFeature[] = [
  {
    name: "Interest-based matching",
    free: true,
    boost: true,
    vip: true,
    icon: Heart,
  },
  {
    name: "Country filtering",
    free: "1 country only",
    boost: "All countries",
    vip: "All countries",
    icon: Globe,
  },
  {
    name: "Gender filtering",
    free: false,
    boost: true,
    vip: true,
    icon: Users,
  },
  {
    name: "Custom avatar image",
    free: false,
    boost: false,
    vip: true,
    icon: Camera,
  },
  {
    name: "Advanced filters",
    free: "Basic only",
    boost: "Enhanced",
    vip: "Premium",
    icon: Filter,
  },
  {
    name: "Priority matching",
    free: false,
    boost: true,
    vip: true,
    icon: Zap,
  },
  {
    name: "Ad-free experience",
    free: false,
    boost: false,
    vip: true,
    icon: Star,
  },
]

export default function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const plans = [
    {
      id: "free",
      name: "FREE",
      description: "Perfect for getting started",
      price: "$0",
      period: "forever",
      originalPrice: null,
      popular: false,
      gradient: "from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700",
      borderColor: "border-gray-200 dark:border-gray-700",
      textColor: "text-gray-900 dark:text-gray-100",
      buttonVariant: "outline" as const,
      buttonText: "Current Plan",
      icon: Users,
      features: ["Interest-based matching", "1 country filter", "Basic chat features", "Standard video quality"],
    },
    {
      id: "boost",
      name: "BOOST",
      description: "Power up for 1 hour",
      price: "$2.99",
      period: "1 hour",
      originalPrice: null,
      popular: true,
      gradient: "from-purple-500 to-pink-500",
      borderColor: "border-purple-300",
      textColor: "text-white",
      buttonVariant: "default" as const,
      buttonText: "Get Boost",
      icon: Zap,
      features: [
        "Everything in Free",
        "All country filters",
        "Gender filtering",
        "Priority matching",
        "Enhanced filters",
      ],
    },
    {
      id: "vip",
      name: "VIP",
      description: "The ultimate experience",
      price: isYearly ? "$8.99" : "$9.99",
      period: isYearly ? "month (billed yearly)" : "month",
      originalPrice: isYearly ? "$107.88" : null,
      popular: false,
      gradient: "from-yellow-400 via-purple-500 to-pink-500",
      borderColor: "border-yellow-300",
      textColor: "text-white",
      buttonVariant: "default" as const,
      buttonText: "Go VIP",
      icon: Crown,
      features: [
        "Everything in Boost",
        "Custom avatar image",
        "Premium filters",
        "Ad-free experience",
        "VIP badge",
        "Priority support",
      ],
    },
  ]

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    // Here you would integrate with your payment processor
    console.log(`Selected plan: ${planId}`)
  }

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500" />
    }
    if (value === false) {
      return <X className="h-5 w-5 text-gray-400" />
    }
    return <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="text-center mb-12">

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock premium features and enhance your watch.fun experience
          </p>
        </div>

        {/* Yearly Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
            <span
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${!isYearly ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"}`}
            >
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-purple-600" />
            <span
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${isYearly ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"}`}
            >
              Yearly
              <Badge
                variant="secondary"
                className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              >
                Save 10%
              </Badge>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isPopular = plan.popular
            const isSelected = selectedPlan === plan.id

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  isPopular ? "ring-2 ring-purple-500 shadow-2xl" : "shadow-lg"
                } ${isSelected ? "ring-2 ring-blue-500" : ""} ${plan.borderColor}`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                      <Sparkles className="inline h-4 w-4 mr-1" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-10`} />

                <CardHeader className={`relative ${isPopular ? "pt-12" : "pt-6"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${plan.gradient}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {plan.id === "boost" && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      >
                        <Timer className="h-3 w-3 mr-1" />
                        Limited Time
                      </Badge>
                    )}
                    {plan.id === "vip" && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      >
                        <Infinity className="h-3 w-3 mr-1" />
                        Unlimited
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">{plan.description}</CardDescription>

                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">/{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500 line-through mr-2">{plan.originalPrice}</span>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          Save $
                          {(
                            Number.parseFloat(plan.originalPrice.replace("$", "")) -
                            Number.parseFloat(plan.price.replace("$", "")) * 12
                          ).toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="relative">
                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    variant={plan.buttonVariant}
                    className={`w-full mb-6 h-12 text-lg font-semibold ${
                      plan.buttonVariant === "default"
                        ? `bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white border-0`
                        : ""
                    }`}
                    disabled={plan.id === "free"}
                  >
                    {plan.buttonText}
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Compare All Features</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 font-semibold">Features</th>
                    <th className="text-center py-4 px-4 font-semibold">
                      <div className="flex items-center justify-center">
                        <Users className="h-5 w-5 mr-2" />
                        FREE
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold">
                      <div className="flex items-center justify-center">
                        <Zap className="h-5 w-5 mr-2 text-purple-500" />
                        BOOST
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold">
                      <div className="flex items-center justify-center">
                        <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                        VIP
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {Icon && <Icon className="h-4 w-4 mr-3 text-gray-500" />}
                            <span className="font-medium">{feature.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">{renderFeatureValue(feature.free)}</td>
                        <td className="py-4 px-4 text-center">{renderFeatureValue(feature.boost)}</td>
                        <td className="py-4 px-4 text-center">{renderFeatureValue(feature.vip)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold mb-2">How does Boost work?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Boost gives you premium features for 1 hour, perfect for when you want enhanced matching without a
                monthly commitment.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold mb-2">Can I cancel VIP anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes! You can cancel your VIP subscription at any time. You'll keep access until the end of your billing
                period.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We accept all major credit cards, PayPal, Apple Pay, and Google Pay for your convenience.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold mb-2">Is there a free trial for VIP?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                New users get a 7-day free trial of VIP features. No credit card required to start!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to upgrade your experience?</h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of users who've enhanced their connections with premium features
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handlePlanSelect("boost")}
                size="lg"
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <Zap className="h-5 w-5 mr-2" />
                Try Boost - $2.99
              </Button>
              <Button
                onClick={() => handlePlanSelect("vip")}
                size="lg"
                variant="secondary"
                className="bg-yellow-400 text-purple-900 hover:bg-yellow-300"
              >
                <Crown className="h-5 w-5 mr-2" />
                Go VIP - {isYearly ? "$8.99" : "$9.99"}/month
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
