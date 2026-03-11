"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { apiPatch } from "@/lib/api";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

type Props = {
  candidateId: number;
  initialName: string;
  initialDescription: string | null;
  initialPhoto: string | null;
  from: string | null;
};

export default function EditCandidateForm({
  candidateId,
  initialName,
  initialDescription,
  initialPhoto,
  from,
}: Props) {
  const { user } = useUser();
  const userId = user?.id ?? "";
  const headers: Record<string, string> = userId ? { "X-User-Id": userId } : {};
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhoto);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhoto(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhoto("");       // empty string signals the API to clear it
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSave() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError("Name is required."); return; }

    setSaving(true);
    setError(null);
    try {
      await apiPatch(
        `/candidates/${candidateId}`,
        {
          name: trimmedName,
          description: description.trim() || null,
          photo: photo,   // null = no change, "" = clear, data URL = new photo
        },
        { headers }
      );
      // Navigate back to profile (without edit param)
      const backUrl = from ? `/candidates/${candidateId}?from=${encodeURIComponent(from)}` : `/candidates/${candidateId}`;
      router.push(backUrl);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  const backUrl = from
    ? `/candidates/${candidateId}?from=${encodeURIComponent(from)}`
    : `/candidates/${candidateId}`;

  return (
    <div className="mt-8 space-y-6">
      {/* Photo */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3">Photo</label>
        <div className="flex flex-col items-start gap-3">
          {/* Preview / placeholder */}
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Preview"
              className="w-full max-w-sm rounded-2xl object-cover ring-1 ring-white/10 shadow-xl"
            />
          ) : (
            <div className="flex w-full max-w-sm items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-14">
              <span className="text-sm text-slate-500">No photo</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 transition"
            >
              {photoPreview ? "Change Photo" : "Add Photo"}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={removePhoto}
                className="rounded-xl border border-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition"
              >
                Remove Photo
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">
          Full Name <span className="text-rose-400">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">
          Bio / Notes <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="A brief description…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <a
          href={backUrl}
          className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-400 hover:bg-white/5 transition"
        >
          Cancel
        </a>
      </div>
    </div>
  );
}
