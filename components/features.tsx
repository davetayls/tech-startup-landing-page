"use client"

import {
  ComponentProps,
  UniformSlot,
  UniformText,
} from "@uniformdev/canvas-next-rsc/component"

type FeaturesParameters = {
  heading?: string
  description?: string
}

type FeaturesSlots = "featureCards"

type FeaturesProps = ComponentProps<FeaturesParameters, FeaturesSlots>

export function Features({ component, context, slots }: FeaturesProps) {
  return (
    <section id="features" className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">
            <UniformText
              component={component}
              context={context}
              parameterId="heading"
              placeholder="Features heading"
            />
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            <UniformText
              component={component}
              context={context}
              parameterId="description"
              placeholder="Features description"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UniformSlot
            data={component}
            context={context}
            slot={slots.featureCards}
          />
        </div>
      </div>
    </section>
  )
}
