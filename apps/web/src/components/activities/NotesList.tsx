'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '@/hooks/useActivities';

interface NotesListProps {
  contactId?: string;
  dealId?: string;
}

export function NotesList({ contactId, dealId }: NotesListProps) {
  const { data: notes = [], isLoading } = useNotes(contactId, dealId);
  const create = useCreateNote();
  const update = useUpdateNote();
  const remove = useDeleteNote();

  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleCreate = () => {
    if (!newContent.trim()) return;
    create.mutate(
      { content: newContent, contactId, dealId },
      { onSuccess: () => setNewContent('') },
    );
  };

  const handleUpdate = (id: string) => {
    if (!editingContent.trim()) return;
    update.mutate({ id, content: editingContent }, { onSuccess: () => setEditingId(null) });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Ghi chú ({notes.length})</h3>

      {/* Form thêm ghi chú mới */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Thêm ghi chú mới..."
          rows={3}
          className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreate();
          }}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400">Ctrl+Enter để lưu</span>
          <button
            onClick={handleCreate}
            disabled={!newContent.trim() || create.isPending}
            className="text-xs font-medium text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? 'Đang lưu...' : 'Thêm ghi chú'}
          </button>
        </div>
      </div>

      {/* Danh sách ghi chú */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Chưa có ghi chú nào</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-3">
              {editingId === note.id ? (
                /* Edit mode */
                <div>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleUpdate(note.id)}
                      disabled={update.isPending}
                      className="text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {format(new Date(note.createdAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditingContent(note.content);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Xóa ghi chú này?')) remove.mutate(note.id);
                        }}
                        disabled={remove.isPending}
                        className="text-xs text-gray-400 hover:text-red-500 p-1 rounded"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
