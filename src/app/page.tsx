import { Header, Hero, Features, Pricing, FAQ, CTA, Footer } from "@/app/components/landing"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
