import type { FolderDto } from '../../lib/pointTypes';

export function FolderList({
  folders,
  selectedFolderId,
  onSelectFolder,
}: {
  folders: FolderDto[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}) {
  return (
    <div className="space-y-1 text-xs">
      <div className="font-medium text-slate-700">My folders</div>
      <button
        type="button"
        className={`block w-full rounded px-2 py-1 text-left hover:bg-slate-100 ${
          selectedFolderId === null ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'
        }`}
        onClick={() => onSelectFolder(null)}
      >
        All my points
      </button>
      {folders.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`block w-full rounded px-2 py-1 text-left hover:bg-slate-100 ${
            selectedFolderId === f.id ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'
          }`}
          onClick={() => onSelectFolder(f.id)}
        >
          {f.name}
        </button>
      ))}
    </div>
  );
}
