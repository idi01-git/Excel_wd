// src/app/(main)/events/[slug]/report/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReportDetail {
  id: string;
  title: string;
  coverImage?: string | null;
  content: any;
  createdAt: string;
  author: {
    name: string;
    username: string;
    profilePhoto?: string | null;
  };
}

interface EventSummary {
  id: string;
  title: string;
}

// Custom TipTap JSON to React Node Serializer
function renderTipTapJSON(node: any, index: number = 0): React.ReactNode {
  if (!node) return null;

  const children = node.content 
    ? node.content.map((child: any, idx: number) => renderTipTapJSON(child, idx)) 
    : null;

  switch (node.type) {
    case 'doc':
      return <div key={index} className="prose prose-invert max-w-none">{children}</div>;
    
    case 'paragraph':
      return (
        <p key={index} className="text-gray-300 font-serif text-lg leading-relaxed mb-6">
          {children}
        </p>
      );
    
    case 'heading':
      const level = node.attrs?.level || 2;
      if (level === 1) {
        return <h1 key={index} className="text-3xl font-serif text-white font-bold mt-8 mb-4">{children}</h1>;
      } else if (level === 2) {
        return <h2 key={index} className="text-2xl font-serif text-white font-bold mt-10 mb-4 border-b border-white/5 pb-2">{children}</h2>;
      } else {
        return <h3 key={index} className="text-xl font-serif text-white font-bold mt-6 mb-3">{children}</h3>;
      }
    
    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-violet-500 bg-violet-900/5 px-5 py-3.5 my-6 rounded-r-xl font-serif italic text-gray-400">
          {children}
        </blockquote>
      );
    
    case 'bulletList':
      return <ul key={index} className="list-disc pl-6 mb-6 space-y-2 text-gray-300">{children}</ul>;
    
    case 'orderedList':
      return <ol key={index} className="list-decimal pl-6 mb-6 space-y-2 text-gray-300">{children}</ol>;
    
    case 'listItem':
      return <li key={index}>{children}</li>;
    
    case 'horizontalRule':
      return <hr key={index} className="border-white/10 my-8" />;
    
    case 'image':
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || 'Report image'}
          className="max-w-full h-auto rounded-xl border border-white/10 my-8 mx-auto"
        />
      );
    
    case 'text':
      let element: React.ReactNode = node.text;

      // Apply marks (bold, italic, strike, underline, link)
      if (node.marks && Array.isArray(node.marks)) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') {
            element = <strong key={mark.type}>{element}</strong>;
          } else if (mark.type === 'italic') {
            element = <em key={mark.type}>{element}</em>;
          } else if (mark.type === 'strike') {
            element = <s key={mark.type}>{element}</s>;
          } else if (mark.type === 'underline') {
            element = <u key={mark.type}>{element}</u>;
          } else if (mark.type === 'link') {
            element = (
              <a
                key={mark.type}
                href={mark.attrs?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                {element}
              </a>
            );
          }
        }
      }
      return element;

    default:
      return null;
  }
}

export default function EventReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/events/${slug}/report`);
        const data = await res.json();
        if (data.success) {
          setReport(data.report);
          setEvent(data.event);
        } else {
          router.push(`/events/${slug}`);
        }
      } catch (error) {
        console.error('Failed to load report detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [slug]);

  if (loading || !report || !event) {
    return (
      <div className="max-w-3xl mx-auto py-16 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-900/60 rounded w-1/4 mb-10"></div>
        <div className="h-96 bg-slate-900/60 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-8">
      {/* Back link */}
      <Link href={`/events/${slug}`} className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Event: {event.title}
      </Link>

      {/* Header */}
      <header className="mb-8">
        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-2 block">
          Editorial Report
        </span>
        <h1 className="font-serif text-3xl md:text-4xl text-white font-bold leading-tight mb-4">
          {report.title}
        </h1>

        {/* Author info */}
        <div className="flex items-center gap-3 border-t border-b border-white/5 py-4 mb-6">
          {report.author.profilePhoto && (
            <img
              src={report.author.profilePhoto}
              alt={report.author.name}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
          )}
          <div>
            <span className="block text-sm font-semibold text-white">{report.author.name}</span>
            <span className="block text-[10px] text-gray-500">
              Published on {new Date(report.createdAt).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Cover image */}
        {report.coverImage && (
          <img
            src={report.coverImage}
            alt={report.title}
            className="w-full h-80 object-cover rounded-2xl border border-white/10 shadow-2xl mb-8"
          />
        )}
      </header>

      {/* Content body */}
      <div className="leading-relaxed">
        {renderTipTapJSON(report.content)}
      </div>
    </article>
  );
}
