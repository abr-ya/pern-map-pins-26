import { useAuth } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiPostJson } from '../../lib/api';
import type { FolderDto } from '../../lib/pointTypes';

type CreateFolderFormProps = {
  /** Called after the folder is created and the folders query invalidated. */
  onCreated?: (folder: FolderDto) => void;
};

export function CreateFolderForm({ onCreated }: CreateFolderFormProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (folderName: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in required');
      }
      return apiPostJson<FolderDto>('/api/folders', token, {
        name: folderName,
        groupId: null,
      });
    },
    onSuccess: async (folder) => {
      setName('');
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['folders'] });
      onCreated?.(folder);
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <div className="text-xs font-medium text-slate-700">New folder</div>
      <form
        className="mt-1 flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) {
            return;
          }
          setError(null);
          mutation.mutate(trimmed);
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          maxLength={200}
          className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-900"
          aria-label="New folder name"
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !name.trim()}
          className="shrink-0 rounded bg-slate-800 px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          {mutation.isPending ? '…' : 'Add'}
        </button>
      </form>
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
