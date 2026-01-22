"use client"

import { Card } from "@/components/ui/card"
import { ComponentProps, UniformText, } from "@uniformdev/canvas-next-rsc/component"
import * as LucideIcons from "lucide-react"
import { LucideIcon } from "lucide-react"

type FeatureCardParameters = {
  iconName?: string
  title?: string
  description?: string
}

type FeatureCardProps = ComponentProps<FeatureCardParameters>

export function FeatureCard({
  component,
  context,
  iconName,
  title,
  description,
}: FeatureCardProps) {
  // Dynamically get the icon from lucide-react
  const Icon = (LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Zap

  return (
    <Card className="group relative overflow-hidden bg-card/50 border-border hover:border-accent/50 hover:bg-card/80 transition-all duration-300 p-6 backdrop-blur-sm">
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
          <Icon className="text-accent" size={24} />
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">
          <UniformText
            component={component}
            context={context}
            parameterId="title"
            placeholder="Feature title"
          />
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          <UniformText
            component={component}
            context={context}
            parameterId="description"
            placeholder="Feature description"
          />
        </p>
      </div>
    </Card>
  )
}
