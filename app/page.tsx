import { Button } from "@/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { ArrowRight, MessageSquare, Rocket, User, Shield, Zap, Globe, Lock } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-orange-500/10 opacity-20 blur-[120px]"></div>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="mb-8 animate-in fade-in zoom-in duration-1000">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 opacity-75 blur-lg animate-pulse"></div>
                <Logo className="relative w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl bg-background rounded-full p-2" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-200">
              The <span className="text-gradient">Bitcoin Superapp</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">
              Chat, trade, and launch tokens on Stacks. <br className="hidden md:block" />
              Fully on-chain, encrypted, and powered by your .btc identity.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" asChild>
                <Link href="/chat">
                  Start Chatting <MessageSquare className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 backdrop-blur-sm" asChild>
                <Link href="/launchpad">
                  Launch Token <Rocket className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-4 md:px-6 relative">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need.</h2>
              <p className="text-muted-foreground text-lg">Built for the sovereign individual.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<MessageSquare className="size-6" />}
                title="Encrypted Chat"
                description="End-to-end encrypted messaging using your Stacks keys. Private by default."
                delay={0}
              />
              <FeatureCard
                icon={<User className="size-6" />}
                title=".btc Profiles"
                description="Your Web3 identity. Reputation, social graph, and assets in one place."
                delay={100}
              />
              <FeatureCard
                icon={<Rocket className="size-6" />}
                title="Token Launchpad"
                description="Launch SIP-021 tokens and NFTs with no code. Instant bonding curves."
                delay={200}
              />
              <FeatureCard
                icon={<Shield className="size-6" />}
                title="Bitcoin Secured"
                description="Leveraging Stacks to inherit Bitcoin's security and finality."
                delay={300}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container max-w-5xl mx-auto">
            <div className="glass-card rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent -z-10"></div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to join the economy?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Connect your Leather or Xverse wallet and claim your on-chain identity today.
              </p>
              <Button size="lg" className="rounded-full h-12 px-8" asChild>
                <Link href="/profile/me">
                  Claim Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 px-4 md:px-6 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo className="size-6 opacity-50" />
            <p>© 2025 Stacks Lab. Built on Bitcoin.</p>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-primary transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <Card className="glass-card border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group">
      <CardHeader>
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
