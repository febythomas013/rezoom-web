'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Overview', icon: '◎' },
  { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
  { href: '/dashboard/experiences', label: 'My data', icon: '📋' },
  { href: '/dashboard/resume', label: 'Resume builder', icon: '📄' },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
      <Link href="/dashboard" className="text-lg font-bold tracking-tight px-3 mb-8 block">
        ReZoom
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 text-left"
      >
        Sign out
      </button>
    </aside>
  );
}
