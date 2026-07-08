// src/app/(admin)/admin/library/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, AlertCircle, Upload, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminEditBookPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverInputType, setCoverInputType] = useState<'upload' | 'url'>('upload');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<string[]>([]);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [isbn, setIsbn] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [publishedYear, setPublishedYear] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [amazonLink, setAmazonLink] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE');

  // Custom feedback states
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/library/${id}`);
        const data = await res.json();
        if (data.success && data.book) {
          setTitle(data.book.title || '');
          setAuthor(data.book.author || '');
          setCoverImage(data.book.coverImage || '');
          setDescription(data.book.description || '');
          setGenre(data.book.genre || []);
          setIsbn(data.book.isbn || '');
          setPageCount(data.book.pageCount ? String(data.book.pageCount) : '');
          setPublishedYear(data.book.publishedYear ? String(data.book.publishedYear) : '');
          setTotalCopies(data.book.totalCopies ? String(data.book.totalCopies) : '1');
          setAmazonLink(data.book.amazonLink || '');
          setAvailabilityStatus(data.book.availabilityStatus || 'AVAILABLE');
        } else {
          setErrorMsg('Failed to load book data');
          setInitialLoading(false);
        }
      } catch (err) {
        setErrorMsg('Error fetching book data');
        setInitialLoading(false);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Cover image size must be under 2MB.');
        return;
      }
      setCoverUploading(true);
      setErrorMsg('');
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        const response = await fetch('/api/uploads/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl,
            folder: 'excelsior/library/covers'
          })
        });

        const result = await response.json();
        if (!response.ok || !result.success || typeof result.url !== 'string') {
          throw new Error(result.error || 'Failed to upload cover image');
        }

        if (coverImage && coverImage.includes('cloudinary.com')) {
          try {
            await fetch('/api/uploads/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: coverImage })
            });
          } catch (err) {
            console.error('Failed to clean up old cover image:', err);
          }
        }

        setCoverImage(result.url);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to upload cover image.');
      } finally {
        setCoverUploading(false);
      }
    }
  };

  const LIBRARY_GENRES = [
    'Fiction', 'Philosophy', 'Postmodernism',
    'Magical Realism', 'Poetry', 'Drama', 'Short Stories'
  ];

  const toggleGenre = (g: string) => {
    if (genre.includes(g)) setGenre(genre.filter(item => item !== g));
    else setGenre([...genre, g]);
  };

  const removeGenre = (gToRemove: string) => {
    setGenre(genre.filter(g => g !== gToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/library/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          coverImage,
          description,
          genre,
          isbn,
          pageCount,
          publishedYear,
          totalCopies,
          amazonLink,
          availabilityStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessModalOpen(true);
      } else {
        setErrorMsg(data.error || 'Failed to catalog book');
      }
    } catch (error) {
      console.error('Error adding book:', error);
      setErrorMsg('An unexpected error occurred while saving the book to catalog.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Back to Catalog */}
      <Link href="/admin/library" className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog Manager</span>
      </Link>

      <div className="mb-8 border-b border-gray-200/60 dark:border-white/5 pb-4">
        <h1 className="font-serif text-3xl text-gray-900 dark:text-white font-bold mb-1">Edit Book Details</h1>
        <p className="text-gray-500 dark:text-neutral-450 text-xs font-medium">Update the details for this book in the library catalog.</p>
      </div>

      {initialLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-100 dark:bg-neutral-900 rounded-2xl w-full"></div>
        </div>
      ) : !title && errorMsg ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-300 rounded-xl flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      ) : (
        <>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-neutral-900/30 border border-gray-200/80 dark:border-white/5 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-450 dark:text-neutral-500 uppercase tracking-widest font-bold block">Book Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. One Hundred Years of Solitude"
            className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-450 dark:text-neutral-500 uppercase tracking-widest font-bold block">Author *</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            placeholder="e.g. Gabriel García Márquez"
            className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition"
          />
        </div>

        <div className="flex flex-col gap-4 p-5 bg-gray-50/50 dark:bg-neutral-900/20 border border-gray-200/60 dark:border-white/5 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Cover Image *</label>
            <div className="flex bg-gray-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-gray-200 dark:border-neutral-700/50">
              <button
                type="button"
                onClick={() => setCoverInputType('upload')}
                className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition-colors ${coverInputType === 'upload' ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setCoverInputType('url')}
                className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition-colors ${coverInputType === 'url' ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                URL
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch">
            {/* Image Preview Area */}
            <div className="w-32 shrink-0 aspect-[2/3] rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm relative group flex items-center justify-center">
              {coverImage.trim() ? (
                <>
                  <img 
                    src={coverImage.trim()} 
                    alt="Cover Preview" 
                    className="w-full h-full object-cover" 
                    onError={(e) => e.currentTarget.style.display = 'none'} 
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (coverImage.includes('cloudinary.com')) {
                         try {
                            setCoverUploading(true);
                            await fetch('/api/uploads/delete', { method: 'POST', body: JSON.stringify({ url: coverImage }) });
                         } catch(e){} finally { setCoverUploading(false); }
                      }
                      setCoverImage('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-neutral-600">
                  <BookOpen className="w-6 h-6 opacity-40" />
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">No Cover</span>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-1 w-full relative overflow-hidden flex flex-col justify-center min-h-[140px]">
              <AnimatePresence mode="wait">
                {coverInputType === 'upload' ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={coverUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    <div className="h-full bg-white dark:bg-neutral-950 border border-dashed border-gray-300 dark:border-neutral-700 hover:border-violet-500 dark:hover:border-violet-500 text-gray-900 dark:text-white rounded-xl p-4 text-sm transition flex flex-col items-center justify-center gap-2">
                      <Upload className={`w-5 h-5 ${coverUploading ? 'text-violet-500 animate-pulse' : 'text-gray-400'}`} />
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {coverUploading ? 'Uploading...' : 'Click or drag to upload'}
                      </span>
                      <span className="text-xs text-gray-400">Optimal size: 400x600px. Max 2MB.</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex flex-col justify-center"
                  >
                    <label className="text-[10px] text-gray-400 dark:text-neutral-500 font-semibold uppercase tracking-wider mb-2 px-1">
                      Paste Image URL
                    </label>
                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition shadow-sm"
                    />
                    <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-3 px-1 leading-relaxed">
                      Enter a direct link to an image (JPEG, PNG, WebP). It should automatically load in the preview area on the left.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {coverImage && coverInputType === 'upload' && (
            <p className="text-[10px] text-gray-400 mt-1 truncate px-2">Uploaded: {coverImage}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Synopsis / Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Write a brief summary of the book content and themes..."
            className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Genres *</label>
            <div 
              className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-2 flex flex-wrap gap-2 cursor-pointer min-h-[46px] items-center transition hover:border-violet-500/50"
              onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
            >
              {genre.length === 0 ? (
                <span className="text-sm text-gray-400 px-1">Select genres...</span>
              ) : (
                genre.map((g) => (
                  <span key={g} className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                    {g}
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeGenre(g); }} 
                      className="text-gray-400 hover:text-red-500 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
              <div className="ml-auto pr-2">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <AnimatePresence>
              {genreDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setGenreDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-[100%] left-0 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 py-2 overflow-hidden"
                  >
                    {LIBRARY_GENRES.map((g) => (
                      <label key={g} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={genre.includes(g)}
                          onChange={() => toggleGenre(g)}
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{g}</span>
                      </label>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Total Copies Owned *</label>
            <input
              type="number"
              value={totalCopies}
              onChange={(e) => setTotalCopies(e.target.value)}
              required
              min="1"
              className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">ISBN</label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="ISBN"
              className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Pages</label>
            <input
              type="number"
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              placeholder="Pages"
              className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Year</label>
            <input
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(e.target.value)}
              placeholder="e.g. 1967"
              className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200/80 dark:border-white/5">
           <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Additional Metadata (Optional)</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div className="flex flex-col gap-1.5">
               <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Amazon Link</label>
               <input type="url" value={amazonLink} onChange={e => setAmazonLink(e.target.value)} placeholder="e.g. https://amazon.com/..." className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition" />
             </div>
             <div className="flex flex-col gap-1.5">
               <label className="text-[10px] text-gray-455 dark:text-neutral-500 uppercase tracking-widest font-bold block">Status</label>
               <select value={availabilityStatus} onChange={e => setAvailabilityStatus(e.target.value)} className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition">
                 <option value="AVAILABLE">Available</option>
                 <option value="ISSUED">Issued</option>
                 <option value="MAINTENANCE">Maintenance</option>
               </select>
             </div>
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/80 dark:border-white/5">
          <Link
            href="/admin/library"
            className="py-2.5 px-6 bg-transparent border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-350 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-7 bg-linear-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 text-white rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
      </>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {successModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-center z-10"
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-2">Book Updated</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs mb-6 leading-relaxed">
                "{title}" by {author} has been successfully updated in the library catalog database.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccessModalOpen(false);
                  router.push('/admin/library');
                }}
                className="w-full py-2.5 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition cursor-pointer shadow-sm"
              >
                Go to Catalog Manager
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
