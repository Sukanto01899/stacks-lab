import Link from "next/link"
import { ArrowRight, MessageSquare, Rocket, User, Shield, Zap, Cpu, Radio } from "lucide-react"
import { Button } from "@/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { Logo } from "@/components/ui/logo"

const features = [
  { icon: <MessageSquare className="size-6" />, title: "Encrypted Chat", desc: "End-to-end messaging with on-chain keys." },
  { icon: <User className="size-6" />, title: ".btc Profiles", desc: "Identity, reputation, and holdings in one view." },
  { icon: <Rocket className="size-6" />, title: "Launchpad", desc: "Ship SIP-010/009 assets with no-code flows." },
  { icon: <Shield className="size-6" />, title: "Bitcoin Secured", desc: "Stacks settlement with Bitcoin finality." },
]

const highlights = [
  { title: "Stacks + Bitcoin", body: "Dual-layer design merges Bitcoin security with expressive Clarity contracts." },
  { title: "Retro-grade UX", body: "Grid lines, neon accents, and bold typography for a memorable interface." },
  { title: "Composable Primitives", body: "Wallets, chat, launchpad, and marketplace wired through shared contracts." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="absolute inset-0 -z-10 retro-grid opacity-40" />
      <div className="absolute inset-0 -z-20 blur-3xl opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.18),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,170,0,0.12),transparent_30%),radial-gradient(circle_at_30%_80%,rgba(255,0,170,0.16),transparent_32%)]" />

      <main className="flex-1">
        <section className="container px-4 md:px-8 pt-24 md:pt-32">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 bg-primary/10 text-primary border border-primary/30 shadow-[0_0_0_1px_rgba(0,0,0,0.12)]">
                <Radio className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Bitcoin Native Stack</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight">
                Build, chat, and trade <span className="text-gradient">on-chain</span> with Stacks Lab.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                A retro-futurist cockpit for Bitcoin L2: encrypted chat, .btc profiles, a launchpad, and a curated marketplace—wired to Clarity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="rounded-full px-7 shadow-lg shadow-primary/30">
                  <Link href="/chat">
                    Enter Chat <MessageSquare className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full px-7 border-primary/30 hover:bg-primary/10">
                  <Link href="/launchpad">
                    Launch Asset <Rocket className="ml-2 size-5" />
                  </Link>
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 pt-4">
                {highlights.map((h) => (
                  <div key={h.title} className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
                    <div className="text-sm font-semibold text-primary mb-1">{h.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{h.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative w-full">
              <div className="absolute inset-0 blur-3xl opacity-60 bg-[radial-gradient(circle_at_40%_30%,rgba(0,255,255,0.28),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(255,170,0,0.18),transparent_30%)]" />
              <div className="relative glass-card rounded-3xl p-6 border border-primary/30 retro-scanline">
                <div className="flex items-center gap-3 mb-6">
                  <Logo className="size-10" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Stacks Lab</div>
                    <div className="text-lg font-semibold">Superapp Console</div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <InfoRow icon={<Zap className="size-4" />} label="Live" value="Mainnet contracts synced" />
                  <InfoRow icon={<Cpu className="size-4" />} label="Launchpad" value="Bonding curve + vesting" />
                  <InfoRow icon={<Shield className="size-4" />} label="Security" value="E2EE chat + Bitcoin finality" />
                  <InfoRow icon={<User className="size-4" />} label="Identity" value=".btc-first authentication" />
                </div>
                <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary-foreground/80">
                  <div className="font-semibold text-primary-foreground">Tip</div>
                  Connect Leather or Xverse, then mint an avatar before launching your asset to unlock marketplace perks.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container px-4 md:px-8 py-16">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Capabilities</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="glass-card border border-border/60 hover:border-primary/50 transition-all duration-200 hover:-translate-y-1">
                <CardHeader>
                  <div className="size-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
                    {f.icon}
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10 px-4 md:px-8 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Logo className="size-6 opacity-70" />
            <p>(c) 2025 Stacks Lab. Bitcoin-native by design.</p>
          </div>
          <div className="flex gap-6">
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

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
