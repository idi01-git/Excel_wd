'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Plus, Save, Trash2, ArrowLeft, BookOpen, Layers, Type, Clock, FileText } from 'lucide-react';
import { uploadImageBlob, deleteUploadedImage } from '@/lib/upload';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';

type Card = {
  title: string;
  writer: string;
  category?: string;
  readTime?: string;
  words?: string;
  description: string;
  href: string;
  image?: string;
  accent?: string;
};

type Strip = { eventId?: string; title: string; kind: string; date: string; venue: string; image: string; href: string };
type AssetEvent = { id: string; title: string; date: string; venue: string; posterImage?: string | null; coverImage?: string | null; slug: string };
type AssetPublication = {
  id: string;
  title: string;
  coverImage?: string | null;
  slug: string;
  category?: string;
  readingTime?: number;
  authorName?: string | null;
  authorNote?: string | null;
  alumniProfile?: { name: string; batch: string } | null;
  author: { name: string };
};
type AssetBook = { id: string; title: string; author: string; coverImage?: string | null; slug: string; excerpt?: string | null; synopsis?: string | null; genre?: string[] };
type AssetLibraryBook = { id: string; title: string; author: string; coverImage?: string | null; description?: string | null; genre?: string[]; pageCount?: number | null; publishedYear?: number | null };
type AssetAlumnus = { id: string; name: string; batch: string; currentPosition?: string | null; message?: string | null };

type Assets = {
  events: AssetEvent[];
  publications: AssetPublication[];
  books: AssetBook[];
  libraryBooks: AssetLibraryBook[];
  alumni: AssetAlumnus[];
};

const blankCard = (): Card => ({
  title: '',
  writer: '',
  category: 'ARTICLE',
  readTime: '5 min read',
  words: '1,200',
  description: '',
  href: '/publications',
  image: '',
  accent: '#f3e8d2',
});

const blankStrip = (): Strip => ({ title: '', kind: 'Event', date: '', venue: '', image: '', href: '/events' });

export default function HomepageCmsPage() {
  const [tab, setTab] = useState<'cards' | 'events' | 'voices'>('cards');
  const [assets, setAssets] = useState<Assets>({
    events: [],
    publications: [],
    books: [],
    libraryBooks: [],
    alumni: [],
  });
  const [cards, setCards] = useState<Card[]>([]);
  const [items, setItems] = useState<Strip[]>([]);
  const [mode, setMode] = useState<'RANDOM' | 'CURATED'>('RANDOM');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch('/api/admin/homepage/assets').then((r) => r.json()),
      fetch('/api/admin/cms').then((r) => r.json()),
    ])
      .then(([assetData, cmsData]) => {
        if (assetData.success) {
          setAssets({
            events: assetData.events || [],
            publications: assetData.publications || [],
            books: assetData.books || [],
            libraryBooks: assetData.libraryBooks || [],
            alumni: assetData.alumni || [],
          });
        }
        const settings = cmsData.settings || {};
        setCards(settings['home.heroCards']?.cards || []);
        setItems(settings['home.eventsStrip']?.items || []);
        setMode(settings['home.testimonials']?.mode || 'RANDOM');
        setPinnedIds(settings['home.testimonials']?.pinnedIds || []);
      })
      .catch(() => setNotice('Could not load CMS data.'));
  }, []);

  const save = async () => {
    const key = tab === 'cards' ? 'home.heroCards' : tab === 'events' ? 'home.eventsStrip' : 'home.testimonials';
    const value = tab === 'cards' ? { cards } : tab === 'events' ? { items } : { mode, pinnedIds };
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/homepage/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save');
      setNotice('Saved successfully. Refresh the homepage to see the updated cardwall.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File | undefined, index: number) => {
    if (!file) return;

    const validation = validateUploadFile(file, 'MEDIA');
    if (!validation.valid) {
      setNotice(validation.error || 'Please upload an image with size less than 10MB.');
      return;
    }

    try {
      const oldImage = cards[index]?.image;
      if (oldImage && oldImage.includes('cloudinary.com')) {
        await deleteUploadedImage(oldImage);
      }
      const url = await uploadImageBlob(file, 'homepage-cards', file.name);
      setCards((all) => all.map((card, i) => (i === index ? { ...card, image: url } : card)));
      setNotice('Image attached successfully.');
    } catch (err: any) {
      setNotice(err.message || 'Image upload failed. Please upload an image with size less than 10MB.');
    }
  };

  const cleanSnippet = (text?: string | null, maxLen = 175): string => {
    if (!text) return '';
    const clean = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#*`_~>[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return '';
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen).trim().replace(/[.,;:!\s]+$/, '') + '...';
  };

  const chooseCardSource = (index: number, source: string) => {
    if (!source) return;
    const [kind, id] = source.split(':');

    if (kind === 'publication') {
      const item = assets.publications.find((x) => x.id === id);
      if (!item) return;
      const snippet =
        cleanSnippet(item.excerpt || item.content || item.authorNote) ||
        'An original literary piece published by the Excelsior Literary Society.';

      setCards((all) =>
        all.map((card, i) =>
          i === index
            ? {
                ...card,
                title: item.title,
                writer: item.authorName || item.alumniProfile?.name || item.author.name,
                category: item.category || 'ARTICLE',
                readTime: `${item.readingTime || 4} min read`,
                words: `${(item.readingTime || 4) * 250}`,
                description: snippet,
                image: item.coverImage || '',
                href: `/publications/${item.slug}`,
              }
            : card
        )
      );
    } else if (kind === 'book') {
      const item = assets.books.find((x) => x.id === id);
      if (!item) return;
      const snippet =
        cleanSnippet(item.synopsis || item.excerpt) ||
        `Curated hardback edition featured in the Excelsior Editor's Shelf.`;

      setCards((all) =>
        all.map((card, i) =>
          i === index
            ? {
                ...card,
                title: item.title,
                writer: item.author,
                category: item.genre?.[0]?.toUpperCase() || "EDITOR'S PICK",
                readTime: 'Hardback Volume',
                words: 'Curated Edition',
                description: snippet,
                image: item.coverImage || '',
                href: `/editors-shelf/${item.slug}`,
              }
            : card
        )
      );
    } else if (kind === 'library') {
      const item = assets.libraryBooks.find((x) => x.id === id);
      if (!item) return;
      const snippet =
        cleanSnippet(item.description) ||
        `Available in the Excelsior Club Library for borrowing. Category: ${item.genre?.join(', ') || 'Literature'}.`;

      setCards((all) =>
        all.map((card, i) =>
          i === index
            ? {
                ...card,
                title: item.title,
                writer: item.author || 'Society Library',
                category: item.genre?.[0]?.toUpperCase() || 'LIBRARY BOOK',
                readTime: item.pageCount ? `${item.pageCount} pages` : 'Club Library',
                words: item.pageCount ? `${item.pageCount} pages` : (item.publishedYear ? `Pub. ${item.publishedYear}` : 'Society Volume'),
                description: snippet,
                image: item.coverImage || '',
                href: `/community/library/${item.id}`,
                accent: '#d4af37',
              }
            : card
        )
      );
    }
  };

  const chooseEvent = (index: number, id: string) => {
    const event = assets.events.find((x) => x.id === id);
    if (!event) return;
    setItems((all) =>
      all.map((item, i) =>
        i === index
          ? {
              ...item,
              eventId: id,
              title: event.title,
              kind: 'Event',
              date: new Date(event.date).toLocaleDateString(),
              venue: event.venue,
              image: event.posterImage || '',
              href: `/events/${event.slug}`,
            }
          : item
      )
    );
  };

  const toggleEventPoster = (index: number, checked: boolean) => {
    const item = items[index];
    const event = item?.eventId ? assets.events.find((x) => x.id === item.eventId) : undefined;
    setItems((all) =>
      all.map((x, i) =>
        i === index ? { ...x, image: checked ? event?.posterImage || event?.coverImage || '' : '' } : x
      )
    );
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1 hover:text-foreground transition">
          <ArrowLeft size={12} />
          <span>View homepage</span>
        </Link>
        <header className="mt-6 flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Homepage controls</p>
            <h1 className="mt-2 font-serif text-4xl font-bold">Homepage CMS</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure 3D Hero Cards with custom titles, word/page counts, categories, reading times, and links.
            </p>
          </div>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-background hover:opacity-90 transition cursor-pointer"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </header>

        {notice && (
          <p className="mt-5 rounded-2xl border border-border bg-card p-3 text-sm font-mono">{notice}</p>
        )}

        <div className="mt-7 flex gap-2 border-b border-border pb-4">
          {([
            ['cards', 'Hero cards'],
            ['events', 'Event strip'],
            ['voices', 'Testimonials'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition cursor-pointer ${
                tab === key ? 'bg-foreground text-background' : 'border border-border hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'cards' && (
          <section className="mt-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold">Animated 3D Hero Cards</h2>
                <p className="text-sm text-muted-foreground">
                  Add up to 24 cards. All card text, word counts, page numbers, categories, and badges are fully editable.
                </p>
              </div>
              <button
                onClick={() => cards.length < 24 && setCards((all) => [...all, blankCard()])}
                className="rounded-full border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition cursor-pointer"
              >
                <Plus size={13} className="mr-1 inline" />
                Add card
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {cards.map((card, index) => (
                <article key={index} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <div className="flex justify-between items-center pb-1 border-b border-border/50">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Card {index + 1}
                    </span>
                    <button
                      onClick={() => setCards((all) => all.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-600 cursor-pointer p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Preset Quick-Picker */}
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      Quick Pick Preset (Auto-fills text &amp; stats)
                    </label>
                    <select
                      value=""
                      onChange={(e) => chooseCardSource(index, e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose from Publications, Shelf, or Club Library...</option>
                      
                      {assets.publications.length > 0 && (
                        <optgroup label="── Published Works & Essays ──">
                          {assets.publications.map((item) => (
                            <option key={item.id} value={`publication:${item.id}`}>
                              📄 {item.title} ({item.authorName || item.alumniProfile?.name || item.author.name})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {assets.books.length > 0 && (
                        <optgroup label="── Editor's Shelf Picks ──">
                          {assets.books.map((item) => (
                            <option key={item.id} value={`book:${item.id}`}>
                              ⭐ {item.title} — {item.author}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {assets.libraryBooks.length > 0 && (
                        <optgroup label="── Club Library Books (Catalog) ──">
                          {assets.libraryBooks.map((item) => (
                            <option key={item.id} value={`library:${item.id}`}>
                              📚 {item.title} — {item.author}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Editable Main Details: Title & Writer */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Title</label>
                      <input
                        value={card.title}
                        onChange={(e) =>
                          setCards((all) => all.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))
                        }
                        placeholder="Work title"
                        className="w-full rounded-xl border border-border bg-background p-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Writer / Credit</label>
                      <input
                        value={card.writer}
                        onChange={(e) =>
                          setCards((all) => all.map((x, i) => (i === index ? { ...x, writer: e.target.value } : x)))
                        }
                        placeholder="Author name"
                        className="w-full rounded-xl border border-border bg-background p-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Editable Stats: Words/Count, Category/Badge, and Read Time */}
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <FileText size={11} />
                        <span>Words / Pages / Count</span>
                      </label>
                      <input
                        value={card.words || ''}
                        onChange={(e) =>
                          setCards((all) => all.map((x, i) => (i === index ? { ...x, words: e.target.value } : x)))
                        }
                        placeholder="e.g. 1,250 or 320 pages"
                        className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Type size={11} />
                        <span>Format / Category</span>
                      </label>
                      <input
                        value={card.category || ''}
                        onChange={(e) =>
                          setCards((all) => all.map((x, i) => (i === index ? { ...x, category: e.target.value } : x)))
                        }
                        placeholder="e.g. ARTICLE, BOOK, POEM"
                        className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Clock size={11} />
                        <span>Read Time / Note</span>
                      </label>
                      <input
                        value={card.readTime || ''}
                        onChange={(e) =>
                          setCards((all) => all.map((x, i) => (i === index ? { ...x, readTime: e.target.value } : x)))
                        }
                        placeholder="e.g. 5 min read"
                        className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Short Synopsis / Card Detail</label>
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) =>
                        setCards((all) => all.map((x, i) => (i === index ? { ...x, description: e.target.value } : x)))
                      }
                      placeholder="Brief excerpt or description shown in detail modal..."
                      className="w-full rounded-xl border border-border bg-background p-2 text-sm resize-none"
                    />
                  </div>

                  {/* Destination Link */}
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Destination Link</label>
                    <input
                      value={card.href}
                      onChange={(e) =>
                        setCards((all) => all.map((x, i) => (i === index ? { ...x, href: e.target.value } : x)))
                      }
                      placeholder="e.g. /community/library/id or /publications/slug"
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono"
                    />
                  </div>

                  {/* Custom Card Background / Cover Image */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-muted transition">
                      <ImagePlus size={13} />
                      Custom Image
                      <input
                        type="file"
                        accept={ACCEPT_MAP.MEDIA}
                        className="hidden"
                        onChange={(e) => void upload(e.target.files?.[0], index)}
                      />
                    </label>
                    {card.image && (
                      <span className="text-[10px] font-mono text-emerald-500">Image attached</span>
                    )}
                  </div>

                  {card.image && (
                    <img src={card.image} alt="" className="mt-2 aspect-[3/4] w-24 rounded-xl object-cover border border-border shadow-xs" />
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'events' && (
          <section className="mt-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold">Events strip</h2>
                <p className="text-sm text-muted-foreground">Each row connects to a real event and controls its text and hover image.</p>
              </div>
              <button
                onClick={() => items.length < 8 && setItems((all) => [...all, blankStrip()])}
                className="rounded-full border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition cursor-pointer"
              >
                Add event
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item, index) => (
                <article key={index} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
                  <select
                    value={item.eventId || ''}
                    onChange={(e) => chooseEvent(index, e.target.value)}
                    className="rounded-xl border border-border bg-background p-2 text-sm"
                  >
                    <option value="">Connect an event</option>
                    {assets.events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                  <input
                    value={item.kind}
                    onChange={(e) =>
                      setItems((all) => all.map((x, i) => (i === index ? { ...x, kind: e.target.value } : x)))
                    }
                    placeholder="Small label e.g. Poetry Slam"
                    className="rounded-xl border border-border bg-background p-2 text-sm"
                  />
                  <button
                    onClick={() => setItems((all) => all.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-600 cursor-pointer p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                  <input
                    value={item.title}
                    onChange={(e) =>
                      setItems((all) => all.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))
                    }
                    placeholder="Title"
                    className="rounded-xl border border-border bg-background p-2 text-sm"
                  />
                  <input
                    value={item.image}
                    onChange={(e) =>
                      setItems((all) => all.map((x, i) => (i === index ? { ...x, image: e.target.value } : x)))
                    }
                    placeholder="Hover-card image URL"
                    className="rounded-xl border border-border bg-background p-2 text-sm"
                  />
                  <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={
                        Boolean(item.eventId) &&
                        Boolean(item.image) &&
                        item.image ===
                          (assets.events.find((x) => x.id === item.eventId)?.posterImage ||
                            assets.events.find((x) => x.id === item.eventId)?.coverImage)
                      }
                      disabled={!item.eventId}
                      onChange={(e) => toggleEventPoster(index, e.target.checked)}
                    />
                    <span>
                      Use event&rsquo;s poster
                      <span className="block font-mono text-[9px] uppercase tracking-widest opacity-70">
                        {item.eventId ? 'reuses the event image — no upload needed' : 'link an event first'}
                      </span>
                    </span>
                  </label>
                  {item.image && <img src={item.image} alt="" className="h-28 w-44 rounded-xl border border-border object-cover" />}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'voices' && (
          <section className="mt-6 max-w-3xl">
            <h2 className="font-serif text-2xl font-bold">Alumni testimonials</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Random shows four alumni quotes automatically. Curated lets you choose exactly who appears.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setMode('RANDOM')}
                className={`rounded-full px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition cursor-pointer ${
                  mode === 'RANDOM' ? 'bg-foreground text-background' : 'border border-border'
                }`}
              >
                Random 4
              </button>
              <button
                onClick={() => setMode('CURATED')}
                className={`rounded-full px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition cursor-pointer ${
                  mode === 'CURATED' ? 'bg-foreground text-background' : 'border border-border'
                }`}
              >
                Choose alumni
              </button>
            </div>
            {mode === 'CURATED' && (
              <div className="mt-5 space-y-2">
                {assets.alumni.map((alumnus) => (
                  <label key={alumnus.id} className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={pinnedIds.includes(alumnus.id)}
                      disabled={!pinnedIds.includes(alumnus.id) && pinnedIds.length >= 4}
                      onChange={() =>
                        setPinnedIds((ids) =>
                          ids.includes(alumnus.id) ? ids.filter((id) => id !== alumnus.id) : [...ids, alumnus.id]
                        )
                      }
                    />
                    <span>
                      <strong>{alumnus.name}</strong>
                      <span className="ml-2 text-muted-foreground">
                        {alumnus.batch} · {alumnus.currentPosition}
                      </span>
                      <span className="mt-1 block text-muted-foreground">{alumnus.message}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}