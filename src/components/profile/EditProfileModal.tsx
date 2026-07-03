'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { X, Upload, Loader2, Camera } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    username: string;
    bio: string | null;
    profilePhoto: string | null;
  };
}

export default function EditProfileModal({ isOpen, onClose, currentUser }: EditProfileModalProps) {
  const router = useRouter();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(currentUser.profilePhoto);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser.profilePhoto);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Limit to 500KB
    if (file.size > 500 * 1024) {
      setError('Image must be under 500KB. Please compress or choose a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfilePhoto(base64String);
      setPreviewUrl(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          bio: bio.trim(),
          profilePhoto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update next-auth session cookie with new details
      await update({
        name: name.trim(),
        username: username.trim(),
        profilePhoto: data.user.profilePhoto
      });

      onClose();
      
      // If username changed, redirect to new profile path
      const newUsername = username.trim().toLowerCase();
      if (newUsername !== currentUser.username.toLowerCase()) {
        window.location.href = `/profile/${newUsername}`;
      } else {
        router.refresh();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#0f0f0f] border border-gray-100 dark:border-neutral-800 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 px-6 py-4">
          <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
          <button 
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Photo Upload Area */}
          <div className="flex flex-col items-center gap-4">
            <div className="group relative h-24 w-24 overflow-hidden rounded-full border border-gray-200 dark:border-neutral-800 shadow-inner bg-gray-50 dark:bg-neutral-900">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Profile preview" 
                  className="h-full w-full object-cover transition group-hover:opacity-75"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <Camera className="h-8 w-8" />
                </div>
              )}
              
              <button
                type="button"
                onClick={handleTriggerUpload}
                disabled={loading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              >
                <Upload className="h-5 w-5 text-white" />
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleTriggerUpload}
                disabled={loading}
                className="text-xs font-bold text-violet-600 dark:text-cyan-400 hover:underline"
              >
                Upload new image
              </button>
              <p className="text-[10px] text-gray-400 mt-1">PNG, JPG or WEBP up to 500KB</p>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Text Inputs */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="Your Name"
                className="w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-transparent p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-600 dark:focus:border-cyan-400 transition"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm text-gray-400 font-medium">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder="username"
                  className="w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-transparent py-3 pl-7 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-600 dark:focus:border-cyan-400 transition"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={loading}
                placeholder="Tell readers about yourself..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-transparent p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-600 dark:focus:border-cyan-400 transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2 px-5 border border-gray-200 dark:border-neutral-800 rounded-full text-xs font-bold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 py-2 px-6 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold hover:bg-gray-900 dark:hover:bg-gray-100 transition shadow-sm disabled:opacity-70"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
