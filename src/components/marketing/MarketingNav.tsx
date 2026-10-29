"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Zap } from "lucide-react";

export const MarketingNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const links = [["#features", "Platform"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"], ["#faq", "FAQ"]];
  return <header className="landing-nav"><div className="nav-inner"><Link className="brand" href="/" aria-label="Velox Viral home"><span className="brand-mark"><Zap size={18} fill="currentColor"/></span>velox<span>viral</span></Link><nav className="desktop-nav" aria-label="Main navigation">{links.map(([href,label])=><a href={href} key={href}>{label}</a>)}</nav><div className="nav-actions"><Link className="nav-login" href="/login">Log in</Link><Link className="nav-cta" href="/signup">Get started <ArrowRight size={14}/></Link><button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>{open ? <X size={21}/> : <Menu size={21}/>}</button></div></div>{open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(([href,label])=><a href={href} key={href} onClick={()=>setOpen(false)}>{label}</a>)}<Link href="/login" onClick={()=>setOpen(false)}>Log in</Link></nav>}</header>;
};
