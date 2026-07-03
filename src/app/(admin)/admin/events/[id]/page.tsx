// src/app/(admin)/admin/events/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Registrant {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  extraFields?: any;
  registeredAt: string;
}

interface WinnerInput {
  participantName: string;
  position: 'FIRST' | 'SECOND' | 'THIRD' | 'CONSOLATION' | 'SPECIAL_MENTION' | 'OTHER';
  prize: string;
  description: string;
}

export default function EventManagementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'registrants' | 'report' | 'gallery' | 'winners'>('registrants');

  // Report Form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportCover, setReportCover] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Gallery Upload state
  const [galleryUrl, setGalleryUrl] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryType, setGalleryType] = useState<'PHOTO' | 'POSTER' | 'MEMORY'>('PHOTO');
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Winners Form state
  const [winners, setWinners] = useState<WinnerInput[]>([
    { participantName: '', position: 'FIRST', prize: '', description: '' }
  ]);
  const [winnersLoading, setWinnersLoading] = useState(false);

  const fetchManagementDetails = async () => {
    try {
      // Fetch event by listing all and matching by id, or load by fetching specific endpoint
      const res = await fetch(`/api/events`);
      const data = await res.json();
      if (data.success) {
        // Since slug is needed for public, we can fetch all past and upcoming, find matching event
        const resPast = await fetch('/api/events?status=past');
        const dataPast = await resPast.json();
        
        let all = [...data.events];
        if (dataPast.success) all.push(...dataPast.events);
        
        const matched = all.find(e => e.id === id);
        if (matched) {
          setEvent(matched);
          
          // Fetch event details to prepopulate report if already exists
          const resDetail = await fetch(`/api/events/${matched.slug}`);
          const dataDetail = await resDetail.json();
          if (dataDetail.success && dataDetail.event.report) {
            setReportTitle(dataDetail.event.report.title);
            setReportCover(dataDetail.event.report.coverImage || '');
            
            // Extract text from TipTap JSON safely
            const contentJson = dataDetail.event.report.content;
            if (contentJson?.content?.[0]?.content?.[0]?.text) {
              setReportContent(contentJson.content[0].content[0].text);
            }
          }
          if (dataDetail.success && dataDetail.event.winners.length > 0) {
            setWinners(dataDetail.event.winners.map((w: any) => ({
              participantName: w.participantName,
              position: w.position,
              prize: w.prize || '',
              description: w.description || ''
            })));
          }
        } else {
          router.push('/admin/events');
        }
      }

      // Fetch registrants
      const resRegs = await fetch(`/api/admin/events/${id}/registrations`);
      const dataRegs = await resRegs.json();
      if (dataRegs.success) {
        setRegistrants(dataRegs.registrations);
      }
    } catch (error) {
      console.error('Failed to load event details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagementDetails();
  }, [id]);

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !reportContent || reportLoading) return;

    setReportLoading(true);
    // Format paragraph node for TipTap compatibility
    const contentDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: reportContent
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch(`/api/admin/events/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportTitle,
          coverImage: reportCover,
          content: contentDoc
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Event report recorded successfully!');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryUrl || galleryLoading) return;

    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ url: galleryUrl, caption: galleryCaption, type: galleryType }]
        })
      });
      const data = await res.json();
      if (data.success) {
        setGalleryUrl('');
        setGalleryCaption('');
        alert('Media upload successful!');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding gallery item:', error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleWinnersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (winnersLoading) return;

    setWinnersLoading(true);
    try {
      const filteredWinners = winners.filter(w => w.participantName.trim());
      const res = await fetch(`/api/admin/events/${id}/winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winners: filteredWinners })
      });
      const data = await res.json();
      if (data.success) {
        alert('Winners updated and registrants notified!');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error submitting winners:', error);
    } finally {
      setWinnersLoading(false);
    }
  };

  const addWinnerRow = () => {
    setWinners([...winners, { participantName: '', position: 'FIRST', prize: '', description: '' }]);
  };

  const updateWinnerField = (index: number, field: keyof WinnerInput, value: string) => {
    const updated = [...winners];
    updated[index] = { ...updated[index], [field]: value };
    setWinners(updated);
  };

  if (loading || !event) {
    return (
      <div className="max-w-4xl mx-auto py-16 animate-pulse">
        <div className="h-10 bg-slate-900/60 rounded w-1/3 mb-10"></div>
        <div className="h-64 bg-slate-900/60 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      {/* Back button */}
      <Link href="/admin/events" className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Events Manager
      </Link>

      {/* Title */}
      <div className="mb-8 border-b border-white/5 pb-5">
        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider block mb-1">Event Administration</span>
        <h1 className="font-serif text-3xl text-white font-bold mb-1">{event.title}</h1>
        <p className="text-gray-400 text-xs">📍 {event.venue} | 📅 {new Date(event.date).toLocaleDateString()}</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-white/5 pb-3 mb-8 flex-wrap">
        <button
          onClick={() => setActiveTab('registrants')}
          className={`py-1.5 px-4 text-xs font-semibold rounded-lg transition ${
            activeTab === 'registrants' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Registrations ({registrants.length})
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`py-1.5 px-4 text-xs font-semibold rounded-lg transition ${
            activeTab === 'report' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Post-Event Report
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`py-1.5 px-4 text-xs font-semibold rounded-lg transition ${
            activeTab === 'gallery' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Event Media Upload
        </button>
        {event.isCompetition && (
          <button
            onClick={() => setActiveTab('winners')}
            className={`py-1.5 px-4 text-xs font-semibold rounded-lg transition ${
              activeTab === 'winners' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            Winners Board
          </button>
        )}
      </div>

      {/* Tab 1: Registrations list */}
      {activeTab === 'registrants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg text-white font-bold">Registered Members</h3>
            {registrants.length > 0 && (
              <button
                onClick={() => {
                  const headers = ['Name', 'Email', 'Phone', 'Registered At'];
                  const rows = registrants.map(r => [r.name, r.email, r.phone || '', new Date(r.registeredAt).toLocaleDateString()]);
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `${event.title.replace(/\s+/g, '_')}_registrations.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="py-1 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold rounded-lg transition"
              >
                📥 Export CSV
              </button>
            )}
          </div>

          {registrants.length > 0 ? (
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse text-xs text-gray-300">
                <thead>
                  <tr className="bg-slate-950 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500">
                    <th className="p-4 pl-6">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4 pr-6">Dietary Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registrants.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/2">
                      <td className="p-4 pl-6 text-white font-bold">{reg.name}</td>
                      <td className="p-4">{reg.email}</td>
                      <td className="p-4 text-gray-500">{reg.phone || '—'}</td>
                      <td className="p-4 pr-6 text-gray-500 italic">
                        {reg.extraFields?.dietary || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
              No participants registered for this event yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Write Report form */}
      {activeTab === 'report' && (
        <form onSubmit={handleSaveReport} className="space-y-4 bg-slate-900/20 border border-white/5 p-6 rounded-2xl">
          <h3 className="font-serif text-lg text-white font-bold border-b border-white/5 pb-2 mb-4">Editorial Report</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              required
              placeholder="e.g. Highlights and Recap of the Annual Poetry Contest"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cover Image URL</label>
            <input
              type="url"
              value={reportCover}
              onChange={(e) => setReportCover(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/..."
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Report Content</label>
            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              required
              rows={8}
              placeholder="Provide a summary of discussions, attendee counts, and milestones..."
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={reportLoading}
              className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
            >
              {reportLoading ? 'Saving...' : 'Publish Report'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Upload Gallery media */}
      {activeTab === 'gallery' && (
        <form onSubmit={handleAddGalleryItem} className="space-y-4 bg-slate-900/20 border border-white/5 p-6 rounded-2xl">
          <h3 className="font-serif text-lg text-white font-bold border-b border-white/5 pb-2 mb-4">Add Media Item</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Image URL</label>
            <input
              type="url"
              value={galleryUrl}
              onChange={(e) => setGalleryUrl(e.target.value)}
              required
              placeholder="e.g. https://images.unsplash.com/..."
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Caption</label>
              <input
                type="text"
                value={galleryCaption}
                onChange={(e) => setGalleryCaption(e.target.value)}
                placeholder="e.g. Members reciting poems"
                className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Category Type</label>
              <select
                value={galleryType}
                onChange={(e: any) => setGalleryType(e.target.value)}
                className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600"
              >
                <option value="PHOTO">Photo</option>
                <option value="POSTER">Poster</option>
                <option value="MEMORY">Memory</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={galleryLoading}
              className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
            >
              {galleryLoading ? 'Uploading...' : 'Save Gallery Image'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Winners board */}
      {activeTab === 'winners' && (
        <form onSubmit={handleWinnersSubmit} className="space-y-4 bg-slate-900/20 border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4">
            <h3 className="font-serif text-lg text-white font-bold">Contest Winners</h3>
            <button
              type="button"
              onClick={addWinnerRow}
              className="py-1 px-3 bg-violet-600/10 border border-violet-500/30 hover:bg-violet-600 text-violet-400 hover:text-white rounded-lg text-[10px] font-bold transition"
            >
               Add Winner Row
            </button>
          </div>

          <div className="space-y-4">
            {winners.map((winner, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Participant Name</label>
                  <input
                    type="text"
                    value={winner.participantName}
                    onChange={(e) => updateWinnerField(index, 'participantName', e.target.value)}
                    required
                    placeholder="e.g. Jane Doe"
                    className="bg-slate-950 border border-white/10 text-white rounded-lg p-2 text-xs outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Position</label>
                  <select
                    value={winner.position}
                    onChange={(e: any) => updateWinnerField(index, 'position', e.target.value)}
                    className="bg-slate-950 border border-white/10 text-white rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="FIRST">First</option>
                    <option value="SECOND">Second</option>
                    <option value="THIRD">Third</option>
                    <option value="CONSOLATION">Consolation</option>
                    <option value="SPECIAL_MENTION">Special Mention</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Prize (e.g. certificate + cash)</label>
                  <input
                    type="text"
                    value={winner.prize}
                    onChange={(e) => updateWinnerField(index, 'prize', e.target.value)}
                    placeholder="e.g. Trophy + ₹500"
                    className="bg-slate-950 border border-white/10 text-white rounded-lg p-2 text-xs outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Description / Notes</label>
                  <input
                    type="text"
                    value={winner.description}
                    onChange={(e) => updateWinnerField(index, 'description', e.target.value)}
                    placeholder="e.g. Slam poet champion"
                    className="bg-slate-950 border border-white/10 text-white rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={winnersLoading}
              className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
            >
              {winnersLoading ? 'Announcing Winners...' : 'Announce and Notify Registrants'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
