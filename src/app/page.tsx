import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown, CircleCheck, Globe2, Layers3, MoreHorizontal, PenLine, Send, Sparkles, WandSparkles, Zap } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { PLANS, PLAN_ORDER, formatPlanPrice, planAmount, DEFAULT_BILLING_CURRENCY } from "@/lib/plans";
import { serverEnv } from "@/lib/env.server";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: `${BRAND.name} — Your social universe, in sync`, description: BRAND.description };

const features = [
  { number: "01 / CREATE", title: "Make the idea happen.", description: "Turn a spark into a scroll-stopping post. Write once, then tailor your message for every platform.", icon: PenLine, visual: "create" },
  { number: "02 / PUBLISH", title: "Be everywhere, effortlessly.", description: "Plan your content, schedule it ahead, and keep your channels moving from one simple workspace.", icon: CalendarDays, visual: "publish" },
  { number: "03 / INTELLIGENCE", title: "Create with a little help.", description: "Find your next great angle, refine your captions, and make more of every idea with AI.", icon: Sparkles, visual: "ai" },
  { number: "04 / INSIGHTS", title: "Know what resonates.", description: "See how your content performs across channels and turn real insights into your next move.", icon: BarChart3, visual: "insights" },
];
const platforms = ["Instagram", "TikTok", "LinkedIn", "Facebook", "X", "YouTube", "Threads"];
const faqs = [
  ["How do I get started?", "Create your account, connect a social channel, and start creating from your workspace."],
  ["Can I publish to multiple platforms?", "Yes. Create a post once and tailor it for your connected social channels."],
  ["Is there a free plan?", "Yes. You can get started for free and upgrade when you need more room to grow."],
  ["Are my accounts secure?", "Access tokens are encrypted and used by server-side publishing code. Your data is isolated to your account."],
];

function FeatureVisual({ type }: { type: string }) {
  if (type === "create") return <div className="mock-window"><div className="mock-top"><span className="mock-dots">● ● ●</span><span>New post</span><MoreHorizontal size={15}/></div><div className="mock-body"><div className="mock-label">YOUR WORKSPACE <span>✦</span></div><div className="mock-title">What are we sharing today?</div><div className="mock-lines"><i/><i/><i/></div><div className="mock-bottom"><span>＋ Add media</span><b>Continue <ArrowRight size={12}/></b></div></div></div>;
  if (type === "publish") return <div className="mock-window calendar"><div className="mock-top"><span>Content calendar</span><span>•••</span></div><div className="calendar-head"><b>September 2026</b><span>‹ &nbsp; ›</span></div><div className="calendar-grid">{["M","T","W","T","F","S","S",...Array.from({length:28},(_,i)=>String(i+1))].map((d,i)=><span className={i===10||i===16||i===25?"active":""} key={i}>{d}{(i===10||i===16||i===25)&&<small>●</small>}</span>)}</div><div className="calendar-note"><CircleCheck size={15}/> Your content is on track</div></div>;
  if (type === "ai") return <div className="mock-window ai-mock"><div className="mock-top"><span>✦ &nbsp; AI caption studio</span><span>•••</span></div><div className="ai-icon"><Sparkles size={20}/></div><b>Let’s make something great.</b><p>What would you like to create today?</p><div className="prompt">Write a post about my latest idea <span>↑</span></div><div className="suggestions"><span>✦ Generate ideas</span><span>↗ Rewrite</span></div></div>;
  return <div className="mock-window analytics"><div className="mock-top"><span>Performance overview</span><span>Last 30 days ﹀</span></div><div className="analytics-stat"><span>YOUR CONTENT AT A GLANCE</span><b>Make every post count.</b><small>Understand what’s working across your channels.</small></div><div className="chart"><div className="chart-bars">{[30,43,37,58,46,70,62,86,72,95,79,100].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div></div>;
}

export default function LandingPage() {
  const currency = serverEnv.PAYSTACK_CURRENCY ?? DEFAULT_BILLING_CURRENCY;
  return <div className="landing">
    <MarketingNav />
    <main>
      <section className="hero grid-bg">
        <div className="hero-orb orb-one">✦</div><div className="hero-orb orb-two">◎</div><div className="hero-orb orb-three">↗</div><div className="hero-orb orb-four">✳</div>
        <div className="hero-inner">
          <div className="eyebrow"><span className="status-dot"/> YOUR SOCIAL WORKSPACE, REIMAGINED <ArrowUpRight size={13}/></div>
          <h1>Your ideas deserve<br/><span>more</span> everywhere.</h1>
          <p>Meet your all-in-one social workspace. Create, schedule, and grow across platforms — all at the speed of your ideas.</p>
          <div className="hero-actions"><Link className="primary-btn" href="/signup">Get started for free <ArrowRight size={16}/></Link><a className="secondary-btn" href="#features">Explore the platform <ArrowRight size={16}/></a></div>
          <div className="hero-note"><Check size={14}/> Free to get started <span>·</span> Built for your next big idea</div>
        </div>
        <div className="hero-bottom"><span>THE FUTURE OF SOCIAL IS YOURS</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>
      <section className="platform-strip" id="platforms"><div><span className="section-kicker">ONE WORKSPACE. ALL YOUR WORLDS.</span><h2>Made for the places<br/>you show up.</h2></div><div className="platform-list">{platforms.map((p,i)=><span key={p}><b>{["◎","♪","in","f","𝕏","▶","@ "][i]}</b>{p}</span>)}</div></section>
      <section className="features-section" id="features"><div className="section-heading"><div><span className="section-kicker">THE VELOX VIRAL PLATFORM</span><h2>Less busywork.<br/><span>More brilliant work.</span></h2></div><p>Everything you need to bring your ideas to life and build your presence, together in one beautifully simple space.</p></div><div className="feature-grid">{features.map((f)=><article className="feature-card" key={f.number}><div className={`feature-visual ${f.visual}`}><FeatureVisual type={f.visual}/></div><div className="feature-copy"><div className="feature-meta"><span>{f.number}</span><f.icon size={17}/></div><h3>{f.title}</h3><p>{f.description}</p><Link href="/signup">Explore feature <ArrowRight size={15}/></Link></div></article>)}</div></section>
      <section className="workflow grid-bg" id="how-it-works"><div className="workflow-copy"><span className="section-kicker">A BETTER WAY TO SHOW UP</span><h2>From first thought<br/>to <em>out in the world.</em></h2><p>Good ideas move fast. Your workflow should too. Bring everything together and make space for the work that matters.</p><Link className="primary-btn" href="/signup">Start creating <ArrowRight size={16}/></Link></div><div className="workflow-steps">{[["01","Create your content","Start with an idea and make it yours."],["02","Plan your moment","Choose your channels and schedule ahead."],["03","Grow with intention","Learn from your results and keep creating."]].map(([n,t,d])=><div className="workflow-step" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div><ArrowUpRight size={18}/></div>)}</div></section>
      <section className="pricing-section" id="pricing"><div className="center-heading"><span className="section-kicker">SIMPLE, FLEXIBLE PRICING</span><h2>Make room for your next big thing.</h2><p>Start where you are. Grow at your own pace.</p></div><div className="pricing-grid">{PLAN_ORDER.map(id=>{const plan=PLANS[id]; return <article className={`price-card ${plan.highlighted ? "featured-price" : ""}`} key={id}>{plan.highlighted && <span className="popular">POPULAR</span>}<h3>{plan.name}</h3><p>{plan.tagline}</p><div className="price">{formatPlanPrice(plan,currency)} {planAmount(plan,currency)>0 && <small>/ month</small>}</div><Link href="/signup" className={plan.highlighted ? "primary-btn" : "secondary-btn"}>Get started <ArrowRight size={15}/></Link><ul>{plan.features.map(feature=><li key={feature}><Check size={15}/>{feature}</li>)}</ul></article>})}</div></section>
      <section className="faq-section" id="faq"><div><span className="section-kicker">GOOD TO KNOW</span><h2>Questions?<br/><span>We've got you.</span></h2></div><div>{faqs.map(([q,a])=><details key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}</div></section>
      <section className="closing-wrap"><div className="closing grid-bg"><span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span><h2>Make your mark<br/>on the internet.</h2><p>Big ideas start somewhere. Let’s make yours go further.</p><Link className="primary-btn" href="/signup">Get started for free <ArrowRight size={16}/></Link><small>Free to get started. Made for what’s next.</small></div></section>
    </main>
    <footer className="landing-footer"><div className="footer-top"><div><Link className="brand" href="/"><span className="brand-mark"><Zap size={18} fill="currentColor"/></span>velox<span>viral</span></Link><p>Your ideas, in motion.<br/>Your social universe, in sync.</p></div><div className="footer-links"><div><b>EXPLORE</b><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#platforms">Platforms</a></div><div><b>GET STARTED</b><a href="#pricing">Pricing</a><Link href="/signup">Create account</Link><Link href="/login">Log in</Link></div><div><b>THE DETAILS</b><a href="#faq">FAQ</a><span>Built for creators</span><span>Made for momentum</span></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Velox Viral. All rights reserved.</span><span>CREATE WITH INTENTION &nbsp; ✦</span></div></footer>
  </div>;
}
