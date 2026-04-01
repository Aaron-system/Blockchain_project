'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Blocks, Settings, Wallet, ArrowRightLeft, Search,
  Sun, Moon, LayoutDashboard, Scale, Network,
  ChevronDown, Check, Menu, X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNode } from '@/contexts/NodeContext';

const nodeLinks = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/blocks',    label: 'Blocks',    icon: Blocks },
  { href: '/configure', label: 'Configure', icon: Settings },
];

const walletLinks = [
  { href: '/wallet',           label: 'Wallet',    icon: Wallet },
  { href: '/transaction/make', label: 'Send',      icon: ArrowRightLeft },
  { href: '/transaction/view', label: 'Explorer',  icon: Search },
  { href: '/balance',          label: 'Balance',   icon: Scale },
  { href: '/visualize',        label: 'Visualize', icon: Network },
];

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
  mobile = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md font-medium transition-colors ${
        mobile
          ? `px-3 py-2.5 text-sm w-full ${isActive ? 'bg-sky-500/15 text-sky-400' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'}`
          : `px-2.5 py-1.5 text-xs whitespace-nowrap ${isActive ? 'bg-sky-500/15 text-sky-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`
      }`}
    >
      <Icon size={mobile ? 16 : 13} />
      {label}
    </Link>
  );
}

function NodeSelector({ onSelect }: { onSelect?: () => void }) {
  const { activeNode, setActiveNode, savedNodes } = useNode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shortUrl = activeNode.replace('http://', '').replace('https://', '');

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span className="max-w-28 truncate">{shortUrl}</span>
        <ChevronDown size={11} className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 min-w-48">
          <p className="px-3 py-1.5 text-xs text-slate-500 border-b border-slate-800">Active Node</p>
          {savedNodes.map((node) => (
            <button
              key={node}
              onClick={() => { setActiveNode(node); setOpen(false); onSelect?.(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-left hover:bg-slate-800 transition-colors"
            >
              {node === activeNode
                ? <Check size={12} className="text-emerald-400 shrink-0" />
                : <span className="w-3 shrink-0" />}
              <span className="text-slate-300 truncate">{node.replace('http://', '')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">

          {/* Brand */}
          <Link href="/" onClick={close} className="flex items-center gap-2 font-bold text-slate-100 shrink-0 mr-2">
            <span className="text-sky-400">⛓</span>
            <span>BlockChain</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-hidden">
            <span className="text-xs text-slate-700 font-medium px-1">Node</span>
            {nodeLinks.map((l) => <NavLink key={l.href} {...l} />)}
            <div className="w-px h-5 bg-slate-800 mx-1" />
            <span className="text-xs text-slate-700 font-medium px-1">Wallet</span>
            {walletLinks.map((l) => <NavLink key={l.href} {...l} />)}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <NodeSelector />
            </div>

            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 py-4 space-y-4">

            {/* Node selector on mobile */}
            <div className="sm:hidden pb-3 border-b border-slate-800">
              <p className="text-xs text-slate-600 mb-2">Active Node</p>
              <NodeSelector onSelect={close} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 mb-1.5 px-1">Node</p>
              <div className="space-y-0.5">
                {nodeLinks.map((l) => <NavLink key={l.href} {...l} mobile onClick={close} />)}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs font-medium text-slate-600 mb-1.5 px-1">Wallet</p>
              <div className="space-y-0.5">
                {walletLinks.map((l) => <NavLink key={l.href} {...l} mobile onClick={close} />)}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
