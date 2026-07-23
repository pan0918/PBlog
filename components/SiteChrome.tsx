"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

/**
 * Keeps public-site chrome mounted across route transitions.  In particular,
 * the account control retains its loaded session and avatar rather than
 * fetching and painting again for every page.
 */
export default function SiteChrome() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return <Navbar />;
}
