import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Zap, Lock } from "lucide-react";

export default function PremiumAIFeatures({ userTier = "free" }) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  // Developers get premium for free
  const isDeveloper = user?.email?.includes('@base44.dev') || user?.role === 'admin';
  const effectiveTier = isDeveloper ? 'master' : userTier;
  const tiers = [
    {
      name: "Free",
      price: "$0",
      features: [
        "Basic AI suggestions",
        "Standard scene visualization",
        "AI level caps at 2",
        "5 AI generations per day"
      ]
    },
    {
      name: "Pro",
      price: "$9.99/mo",
      features: [
        "Enhanced AI creativity",
        "Advanced scene visualization",
        "AI level caps at 3",
        "50 AI generations per day",
        "Multi-world crossover campaigns",
        "Premium art styles",
        "Priority AI processing"
      ]
    },
    {
      name: "Master",
      price: "$19.99/mo",
      features: [
        "Maximum AI intelligence",
        "Masterpiece artwork generation",
        "Unlimited AI level progression",
        "Unlimited AI generations",
        "Exclusive specialized genres",
        "Custom AI personality training",
        "Advanced cosmic campaign arcs",
        "API access for integrations"
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiers.map((tier, i) => (
        <Card key={i} className={`bg-slate-800/50 ${
          tier.name === "Master" ? "border-yellow-500/50" : 
          tier.name === "Pro" ? "border-purple-500/50" : "border-slate-500/30"
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                {tier.name === "Master" && <Crown className="w-5 h-5 text-yellow-400" />}
                {tier.name === "Pro" && <Sparkles className="w-5 h-5 text-purple-400" />}
                <span className={
                  tier.name === "Master" ? "text-yellow-400" :
                  tier.name === "Pro" ? "text-purple-400" : "text-slate-400"
                }>{tier.name}</span>
              </CardTitle>
              {effectiveTier === tier.name.toLowerCase() && (
                <Badge className="bg-green-600">Current</Badge>
              )}
              {isDeveloper && tier.name === "Master" && (
                <Badge className="bg-yellow-600">Developer</Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white mt-2">{tier.price}</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              {tier.features.map((feature, j) => (
                <li key={j} className="text-sm text-white flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {effectiveTier !== tier.name.toLowerCase() && (
              <Button className={`w-full ${
                tier.name === "Master" ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700" :
                tier.name === "Pro" ? "bg-purple-600 hover:bg-purple-700" : "bg-slate-600 hover:bg-slate-700"
              }`}>
                {tier.name === "Free" ? "Current Plan" : `Upgrade to ${tier.name}`}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PremiumFeatureLock({ feature, requiredTier, userTier = "free" }) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  const isDeveloper = user?.email?.includes('@base44.dev') || user?.role === 'admin';
  const effectiveTier = isDeveloper ? 'master' : userTier;
  
  const hasAccess = 
    (requiredTier === "pro" && (effectiveTier === "pro" || effectiveTier === "master")) ||
    (requiredTier === "master" && effectiveTier === "master");

  if (hasAccess) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
      <div className="text-center p-6">
        <Lock className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h4 className="font-semibold text-white mb-2">{feature}</h4>
        <p className="text-sm text-purple-300 mb-3">
          Upgrade to <span className="font-semibold">{requiredTier === "master" ? "Master" : "Pro"}</span> to unlock
        </p>
        <Button className="bg-purple-600 hover:bg-purple-700">
          View Plans
        </Button>
      </div>
    </div>
  );
}