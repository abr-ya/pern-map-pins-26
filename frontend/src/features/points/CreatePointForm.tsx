import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiPatchJson, apiPostEmpty, apiPostJson } from '../../lib/api';
import type { FolderDto, PhotoUploadPayload, PublicPoint, TagDto } from '../../lib/pointTypes';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  folderId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export type CreatePointFormValues = z.infer<typeof schema>;

type CreatePointFormProps = {
  open: boolean;
  latitude: number;
  longitude: number;
  folders: FolderDto[];
  tags: TagDto[];
  selectedFolderId: string | null;
  onClose: () => void;
};

async function uploadToCloudinary(file: File, up: PhotoUploadPayload, pointId: string): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', up.apiKey);
  form.append('timestamp', String(up.timestamp));
  form.append('signature', up.signature);
  form.append('upload_preset', up.uploadPreset);
  form.append('folder', up.folder);
  form.append('public_id', pointId);
  const res = await fetch(up.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary ${res.status}: ${text || res.statusText}`);
  }
}

export function CreatePointForm({
  open,
  latitude,
  longitude,
  folders,
  tags,
  selectedFolderId,
  onClose,
}: CreatePointFormProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePointFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      folderId: selectedFolderId ?? undefined,
      tagIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: '',
        description: '',
        folderId: selectedFolderId ?? undefined,
        tagIds: [],
      });
    }
  }, [open, selectedFolderId, reset]);

  const mutation = useMutation({
    mutationFn: async (input: { values: CreatePointFormValues; file: File | null }) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in required');
      }
      const { values, file } = input;
      const point = await apiPostJson<PublicPoint>('/api/points', token, {
        title: values.title,
        description: values.description ? values.description : null,
        latitude,
        longitude,
        folderId: values.folderId ?? null,
        visibility: 'public',
        groupId: null,
        tagIds: values.tagIds ?? [],
      });

      if (file) {
        const ct = encodeURIComponent(file.type);
        const up = await apiPostEmpty<PhotoUploadPayload>(
          `/api/points/${point.id}/photo-upload?contentType=${ct}`,
          token,
        );
        await uploadToCloudinary(file, up, point.id);
        await apiPatchJson(`/api/points/${point.id}`, token, { photoKey: up.photoKey });
      }

      return point;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['public', 'latest'] });
      await queryClient.invalidateQueries({ queryKey: ['points', 'mine'] });
      reset({
        title: '',
        description: '',
        folderId: selectedFolderId ?? undefined,
        tagIds: [],
      });
      if (fileRef.current) {
        fileRef.current.value = '';
      }
      setSubmitErr(null);
      onClose();
    },
    onError: (e: Error) => {
      setSubmitErr(e.message);
    },
  });

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-point-title"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <h2 id="create-point-title" className="text-lg font-semibold text-slate-900">
          New point
        </h2>
        <p className="mt-1 text-xs text-slate-500" data-testid="create-point-coords">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>

        <form
          className="mt-4 space-y-3"
          onSubmit={handleSubmit((values) => {
            setSubmitErr(null);
            const file = fileRef.current?.files?.[0] ?? null;
            mutation.mutate({ values, file });
          })}
        >
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="pt-title">
              Title
            </label>
            <input
              id="pt-title"
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
              {...register('title')}
              aria-invalid={errors.title ? 'true' : 'false'}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="pt-desc">
              Description
            </label>
            <textarea
              id="pt-desc"
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
              rows={3}
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="pt-folder">
              Folder
            </label>
            <select
              id="pt-folder"
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
              {...register('folderId', {
                setValueAs: (v: string) => (v === '' ? undefined : v),
              })}
            >
              <option value="">— None —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {tags.length > 0 && (
            <fieldset className="space-y-1">
              <legend className="text-xs font-medium text-slate-700">Tags</legend>
              <div className="max-h-28 space-y-1 overflow-y-auto rounded border border-slate-100 p-2">
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" value={t.id} {...register('tagIds')} />
                    {t.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="pt-photo">
              Photo (optional)
            </label>
            <input id="pt-photo" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 text-sm" />
          </div>

          {submitErr && (
            <p className="text-sm text-red-600" role="alert">
              {submitErr}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
              onClick={() => {
                setSubmitErr(null);
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
