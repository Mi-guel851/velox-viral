import { ViralHook } from "../types";

export const VIRAL_HOOKS_DATABASE: ViralHook[] = [
  // 1. Controversial & Contrarian
  {
    id: "hook-1",
    category: "Controversial",
    niche: "Tech & AI",
    template: "Most people think [Common Belief] is the future. They are completely wrong. Here's why:",
    example: "Most people think Prompt Engineering is the future. They are completely wrong. Here's why agentic workflows will replace it in 6 months:",
    viralScoreEstimate: 96,
  },
  {
    id: "hook-2",
    category: "Controversial",
    niche: "SaaS & Growth",
    template: "Stop doing [Common Practice]. It is silently killing your [Desired Result].",
    example: "Stop offering free trials. It is silently killing your enterprise SaaS retention. Here is what we do instead:",
    viralScoreEstimate: 94,
  },
  {
    id: "hook-3",
    category: "Controversial",
    niche: "Finance & Wealth",
    template: "The biggest lie you've been told about [Topic] is [Lie]. The truth is ugly:",
    example: "The biggest lie you've been told about passive income is that it requires no capital. The truth is ugly:",
    viralScoreEstimate: 92,
  },
  {
    id: "hook-4",
    category: "Controversial",
    niche: "Personal Brand",
    template: "Unpopular opinion: [Harsh Truth] matters 10x more than [Popular Vanity Metric].",
    example: "Unpopular opinion: Your distribution network matters 10x more than your product quality. Let's talk about it:",
    viralScoreEstimate: 95,
  },

  // 2. Curiosity Gap & Secrets
  {
    id: "hook-5",
    category: "Curiosity Gap",
    niche: "Tech & AI",
    template: "I spent [Time Spent] analyzing [Large Sample Size]. Here are the [Number] hidden patterns nobody is talking about:",
    example: "I spent 120 hours analyzing 1,000 viral AI tools. Here are the 5 hidden UX patterns nobody is talking about:",
    viralScoreEstimate: 98,
  },
  {
    id: "hook-6",
    category: "Curiosity Gap",
    niche: "Marketing",
    template: "This 3-minute psychological trick generated [Huge Result] without [Pain Point]:",
    example: "This 3-minute psychological trick generated 45,000 leads without spending a dollar on paid ads:",
    viralScoreEstimate: 95,
  },
  {
    id: "hook-7",
    category: "Curiosity Gap",
    niche: "SaaS & Growth",
    template: "The secret playbook [Elite Company] used to scale from [Start] to [Finish] in [Timeframe]:",
    example: "The secret viral playbook Figma used to scale from $0 to $20B acquisition in 6 years (Steal this):",
    viralScoreEstimate: 97,
  },

  // 3. Story & Transformation
  {
    id: "hook-8",
    category: "Story & Transformation",
    niche: "Personal Brand",
    template: "3 years ago, I was [Terrible Situation]. Today, I [Dream Outcome]. Here is the exact system that changed everything:",
    example: "3 years ago, I was drowning in $40k debt with zero followers. Today, I run a $1.2M one-person business. Here is the exact system that changed everything:",
    viralScoreEstimate: 99,
  },
  {
    id: "hook-9",
    category: "Story & Transformation",
    niche: "Tech & AI",
    template: "We almost went bankrupt trying to build [Product]. Then we made 1 pivot that generated [Revenue] in [Days]:",
    example: "We almost went bankrupt trying to launch our AI wrapper. Then we made 1 pivot that generated $84,000 in 14 days:",
    viralScoreEstimate: 93,
  },
  {
    id: "hook-10",
    category: "Story & Transformation",
    niche: "Finance & Wealth",
    template: "I made every possible mistake in [Field] so you don't have to. Here are [Number] rules I wish I knew at 20:",
    example: "I made every possible investing mistake in my 20s so you don't have to. Here are 7 rules that made me a multi-millionaire:",
    viralScoreEstimate: 96,
  },

  // 4. Data & Case Studies
  {
    id: "hook-11",
    category: "Data & Case Studies",
    niche: "Marketing",
    template: "We tested [Option A] vs [Option B] across [SampleSize] users. The data shocked our entire team:",
    example: "We tested Short-form video vs Carousels across 2.4 Million impressions. The data shocked our entire team:",
    viralScoreEstimate: 94,
  },
  {
    id: "hook-12",
    category: "Data & Case Studies",
    niche: "SaaS & Growth",
    template: "How [Company] acquired [Number] customers in [Days] with a $0 budget (Full breakdown):",
    example: "How Notion acquired 1,000,000 users in 12 months with a $0 marketing budget (Full teardown):",
    viralScoreEstimate: 97,
  },

  // 5. Negative Hook (Fear of Missing Out / Costly Errors)
  {
    id: "hook-13",
    category: "Negative Hook",
    niche: "Tech & AI",
    template: "If you are still using [Outdated Tool/Method], you are wasting [Hours/Dollars]. Switch to this immediately:",
    example: "If you are still writing social media captions manually in 2026, you are wasting 20+ hours a week. Switch to this workflow immediately:",
    viralScoreEstimate: 93,
  },
  {
    id: "hook-14",
    category: "Negative Hook",
    niche: "Finance & Wealth",
    template: "The 9 financial traps keeping 99% of hard-working people broke (and how to escape them):",
    example: "The 9 silent financial traps keeping 99% of ambitious professionals broke (and how to escape them):",
    viralScoreEstimate: 91,
  },

  // 6. Authority & How-To
  {
    id: "hook-15",
    category: "Authority & How-To",
    niche: "Marketing",
    template: "How to [Achieve Major Goal] in [Timeframe] (Even if you [Common Obstacle]):",
    example: "How to build a 100k audience across 5 platforms in 90 days (Even if you're starting from scratch with zero budget):",
    viralScoreEstimate: 98,
  },
  {
    id: "hook-16",
    category: "Authority & How-To",
    niche: "Tech & AI",
    template: "The ultimate cheat sheet for [Skill/Tool]. Bookmark this before it gets deleted 🔖:",
    example: "The ultimate cheat sheet for building autonomous AI agents in Next.js. Bookmark this before it gets deleted 🔖:",
    viralScoreEstimate: 99,
  },
];
