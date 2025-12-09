"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How long does it take to set up NeuralFlow?",
    answer:
      "Most organizations get up and running within 24 hours. Our onboarding team provides guided setup, API integration, and custom configuration to match your specific workflows.",
  },
  {
    question: "What level of security does NeuralFlow provide?",
    answer:
      "We maintain enterprise-grade security with SOC 2 Type II compliance, end-to-end encryption, regular security audits, and 99.9% SLA uptime. All data is encrypted at rest and in transit.",
  },
  {
    question: "Can NeuralFlow integrate with our existing systems?",
    answer:
      "Yes! We offer pre-built integrations with 500+ popular applications and custom API endpoints for any system. Our technical team can help with complex integrations.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "You retain full ownership of your data. Upon cancellation, you can export all your data in standard formats. We delete your information from our servers within 30 days of cancellation.",
  },
  {
    question: "Do you offer dedicated support?",
    answer:
      "Yes, all plans include priority support with dedicated account managers, technical support teams, and access to our community forum with 24/7 assistance.",
  },
  {
    question: "How is pricing calculated?",
    answer:
      "Our pricing is based on the number of automated tasks processed monthly. You only pay for what you use with no hidden fees. Enterprise plans come with volume discounts and custom pricing.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-card/30 border-t border-b border-border"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Have questions? We have answers. Can't find what you're looking for?
            <a href="#" className="ml-1 text-accent hover:text-primary transition-colors">
              Contact our support team
            </a>
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <button
              key={index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left p-6 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-all duration-300 hover:border-accent/30"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-foreground text-pretty">{faq.question}</h3>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-accent transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </div>

              {openIndex === index && <p className="mt-4 text-muted-foreground leading-relaxed">{faq.answer}</p>}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
