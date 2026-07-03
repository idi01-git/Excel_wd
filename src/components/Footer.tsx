// src/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black py-16 px-8 mt-auto text-[#ffffff]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <h3 className="font-sans text-[16px] font-bold text-white mb-4">excelsior</h3>
          <p className="text-[#afafaf] text-sm leading-relaxed max-w-sm font-sans">
            Constructing stories, preserving poetry, and establishing community. A sanctuary for campus creative writers and journalists.
          </p>
        </div>
        <div>
          <h4 className="text-[14px] font-medium text-white mb-4 font-sans">Categories</h4>
          <ul className="space-y-3 text-sm font-sans">
            <li>
              <Link href="/publications?category=Articles" className="text-[#4b4b4b] hover:text-[#afafaf] transition">
                Articles & Essays
              </Link>
            </li>
            <li>
              <Link href="/publications?category=Stories" className="text-[#4b4b4b] hover:text-[#afafaf] transition">
                Creative Fiction
              </Link>
            </li>
            <li>
              <Link href="/publications?category=Poems" className="text-[#4b4b4b] hover:text-[#afafaf] transition">
                Slam Poetry
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[14px] font-medium text-white mb-4 font-sans">Ecosystem</h4>
          <ul className="space-y-3 text-sm font-sans">
            <li>
              <Link href="/publications" className="text-[#4b4b4b] hover:text-[#afafaf] transition">
                Explore Curation
              </Link>
            </li>
            <li>
              <Link href="/workspace" className="text-[#4b4b4b] hover:text-[#afafaf] transition">
                Writing Workspace
              </Link>
            </li>
            <li>
              <Link href="/community/members" className="text-[#4b4b4b] hover:text-[#afafaf] transition">
                Legacy & Team
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-[#282828] mt-10 pt-6 text-left text-xs text-[#afafaf] font-sans">
        &copy; {new Date().getFullYear()} Excelsior. All rights reserved.
      </div>
    </footer>
  );
}
