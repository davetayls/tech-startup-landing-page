"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section id="cta" className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 blur-3xl" />

      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
          Ready to Transform Your Workflow?
        </h2>

        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-pretty">
          Join thousands of companies already saving thousands of hours every month with intelligent automation. Get
          started free, no credit card required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base gap-2">
            Start 14-Day Free Trial
            <ArrowRight size={20} />
          </Button>
          <Button variant="outline" className="px-8 h-12 text-base border-border hover:bg-background bg-transparent">
            Schedule a Demo
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          💳 No credit card required. Cancel anytime. Enterprise support available.
        </p>
      </div>
    </section>
  )
}
