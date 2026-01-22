"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import {
  ComponentProps,
  UniformText,
  UniformRichText,
} from "@uniformdev/canvas-next-rsc/component"
import { LinkParamValue } from "@uniformdev/canvas"

type HeroParameters = {
  badgeText?: string
  headline?: string
  headlineHighlight?: string
  description?: string
  primaryCtaText?: string
  primaryCtaLink?: LinkParamValue
  secondaryCtaText?: string
  secondaryCtaLink?: LinkParamValue
  trustBadge1?: string
  trustBadge2?: string
  trustBadge3?: string
}

type HeroProps = ComponentProps<HeroParameters>

export function Hero({ component, context, primaryCtaLink, secondaryCtaLink, trustBadge1, trustBadge2, trustBadge3 }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    // Particle system
    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      opacity: number
    }

    const particles: Particle[] = []
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    const animate = () => {
      // Clear canvas with semi-transparent background for fade effect
      ctx.fillStyle = "rgba(12, 12, 15, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x > canvas.width) particle.x = 0
        if (particle.x < 0) particle.x = canvas.width
        if (particle.y > canvas.height) particle.y = 0
        if (particle.y < 0) particle.y = canvas.height

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 2,
        )
        gradient.addColorStop(0, `rgba(139, 92, 246, ${particle.opacity})`)
        gradient.addColorStop(1, "rgba(139, 92, 246, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2)
        ctx.fill()

        // Core particle
        ctx.fillStyle = `rgba(168, 85, 247, ${particle.opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Particle background */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6 inline-block">
          <UniformText
            component={component}
            context={context}
            parameterId="badgeText"
            as="span"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm text-sm text-muted-foreground hover:text-foreground transition-colors"
            placeholder="✨ Badge text"
          />
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
          <UniformText
            component={component}
            context={context}
            parameterId="headline"
            placeholder="Your headline"
          />
          <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            <UniformText
              component={component}
              context={context}
              parameterId="headlineHighlight"
              placeholder="Highlighted text"
            />
          </span>
        </h1>

        <div className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-pretty">
          <UniformRichText
            component={component}
            context={context}
            parameterId="description"
            placeholder="Description paragraph"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base gap-2"
            asChild
          >
            <a href={primaryCtaLink?.path || "#"}>
              <UniformText
                component={component}
                context={context}
                parameterId="primaryCtaText"
                placeholder="Primary CTA"
              />
              <ArrowRight size={20} />
            </a>
          </Button>
          <Button variant="outline" className="px-8 h-12 text-base gap-2 border-border hover:bg-card bg-transparent" asChild>
            <a href={secondaryCtaLink?.path || "#"}>
              <Play size={20} />
              <UniformText
                component={component}
                context={context}
                parameterId="secondaryCtaText"
                placeholder="Secondary CTA"
              />
            </a>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          {trustBadge1 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>{trustBadge1}</span>
              </div>
              {(trustBadge2 || trustBadge3) && <div className="hidden sm:block w-px h-5 bg-border" />}
            </>
          )}
          {trustBadge2 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>{trustBadge2}</span>
              </div>
              {trustBadge3 && <div className="hidden sm:block w-px h-5 bg-border" />}
            </>
          )}
          {trustBadge3 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>{trustBadge3}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
