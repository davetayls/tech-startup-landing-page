"use client"

import { Card } from "@/components/ui/card"
import { Zap, Brain, BarChart3, Lock, Cpu, RefreshCw } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Advanced machine learning models that learn and adapt to your unique business processes.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process thousands of tasks simultaneously with our distributed infrastructure.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Comprehensive dashboards and insights to monitor performance metrics.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with all major security standards.",
  },
  {
    icon: Cpu,
    title: "Seamless Integration",
    description: "Connect with your existing tools and platforms in minutes.",
  },
  {
    icon: RefreshCw,
    title: "Auto-Scaling",
    description: "Automatically scale resources based on demand, pay only for what you use.",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">
            Powerful Features Built for Scale
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Everything you need to automate, optimize, and grow your business with cutting-edge technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="group relative overflow-hidden bg-card/50 border-border hover:border-accent/50 hover:bg-card/80 transition-all duration-300 p-6 backdrop-blur-sm"
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                    <Icon className="text-accent" size={24} />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
