import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { supabase } from '../../lib/supabase';

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: 'bg-gray-400',    text: 'text-gray-600',   border: 'border-gray-200' },
  { key: 'in_progress', label: 'In Progress',  color: 'bg-amber-400',   text: 'text-amber-700',  border: 'border-amber-200' },
  { key: 'review',      label: 'Review',       color: 'bg-blue-400',    text: 'text-blue-700',   border: 'border-blue-200' },
  { key: 'done',        label: 'Done',         color: 'bg-emerald-500', text: 'text-emerald-700',border: 'border-emerald-200' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    bg: 'bg-gray-100',   text: 'text-gray-500'  },
  { value: 'medium', label: 'Medium', bg: 'bg-amber-100',  text: 'text-amber-700' },
  { value: 'high',   label: 'High',   bg: 'bg-red-100',    text: 'text-red-600'   },
];

function priorityMeta(val) {
  return PRIORITIES.find((p) => p.value === val) ?? PRIORITIES[1];
}

function formatDeadline(date) {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.ceil((d - today) / 86400000);
  const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const overdue = diff < 0;
  const soon = diff >= 0 && diff <= 2;
  return { label, overdue, soon };
}

const EMPTY_FORM = { title: '', description: '', priority: 'medium', deadline: '', status: 'todo' };

export default function TrackerPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', task }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null); // column key being hovered
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);
  const notesTimer = useRef(null);

  useEffect(() => { fetchTasks(); }, []);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('crm_tracker_notes');
    if (saved !== null) setNotes(saved);
  }, []);

  function handleNotesChange(val) {
    setNotes(val);
    setNotesSaved(false);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      localStorage.setItem('crm_tracker_notes', val);
      setNotesSaved(true);
    }, 800);
  }

  async function fetchTasks() {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    setTasks(data ?? []);
    setLoading(false);
  }

  function openAdd(status = 'todo') {
    setForm({ ...EMPTY_FORM, status });
    setModal({ mode: 'add' });
  }

  function openEdit(task) {
    setForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      deadline: task.deadline ?? '',
      status: task.status,
    });
    setModal({ mode: 'edit', task });
  }

  function closeModal() { setModal(null); setForm(EMPTY_FORM); }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      deadline: form.deadline || null,
      status: form.status,
    };
    if (modal.mode === 'add') {
      const { data } = await supabase.from('tasks').insert(payload).select().single();
      if (data) setTasks((prev) => [...prev, data]);
    } else {
      const { data } = await supabase.from('tasks').update(payload).eq('id', modal.task.id).select().single();
      if (data) setTasks((prev) => prev.map((t) => t.id === data.id ? data : t));
    }
    setSaving(false);
    closeModal();
  }

  async function handleDelete() {
    if (!modal?.task) return;
    await supabase.from('tasks').delete().eq('id', modal.task.id);
    setTasks((prev) => prev.filter((t) => t.id !== modal.task.id));
    closeModal();
  }

  async function moveTask(taskId, newStatus) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
  }

  // Drag handlers
  function onDragStart(e, taskId) {
    setDragId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, colKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(colKey);
  }

  function onDrop(e, colKey) {
    e.preventDefault();
    if (dragId && colKey) moveTask(dragId, colKey);
    setDragId(null);
    setDragOver(null);
  }

  function onDragEnd() {
    setDragId(null);
    setDragOver(null);
  }

  const counts = Object.fromEntries(COLUMNS.map((c) => [c.key, tasks.filter((t) => t.status === c.key).length]));

  return (
    <Layout fullWidth>
      <PageHeader
        title="Task Tracker"
        subtitle="Internal tasks and to-dos for the team."
        count={tasks.length}
        className="mb-3 sm:mb-6"
      >
        <button
          onClick={() => openAdd()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl text-[14px] sm:text-[14px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New task
        </button>
      </PageHeader>

      {/* Main content: kanban + notes */}
      <div className="flex flex-col lg:flex-row gap-5 lg:items-stretch">

        {/* Kanban side */}
        <div className="w-full min-w-0 lg:flex-1">
          {/* Stats row — mobile only */}
          <div className="mb-4">
            <div className="flex items-center gap-4 md:hidden px-1 py-1 overflow-x-auto">
              {COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${col.color}`} />
                  <span className="text-[12px] text-gray-500 font-medium">{col.label}</span>
                  <span className="text-[13px] font-bold text-gray-800">{counts[col.key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban board */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-[13px]">Loading…</div>
          ) : (
            <>
              {/* ── Mobile: vertical stacked sections ── */}
              <div className="flex flex-col gap-3 md:hidden">
                {COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.key);
                  return (
                    <div key={col.key} className="rounded-2xl border border-gray-200 bg-gray-50/60 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${col.color}`} />
                          <span className="text-[13px] font-semibold text-gray-700">{col.label}</span>
                          <span className="text-[11px] text-gray-400 font-medium">{colTasks.length}</span>
                        </div>
                        <button
                          onClick={() => openAdd(col.key)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 p-3">
                        {colTasks.length === 0 && (
                          <p className="text-center text-[12px] text-gray-300 py-3">No tasks</p>
                        )}
                        {colTasks.map((task) => {
                          const pr = priorityMeta(task.priority);
                          const dl = formatDeadline(task.deadline);
                          return (
                            <div
                              key={task.id}
                              onClick={() => openEdit(task)}
                              className="bg-white rounded-xl border border-gray-200 px-3.5 py-3 shadow-sm active:scale-[0.98] transition-transform"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${pr.bg} ${pr.text}`}>
                                  {pr.label}
                                </span>
                                {dl && (
                                  <span className={`text-[10px] font-medium ${dl.overdue ? 'text-red-500' : dl.soon ? 'text-amber-500' : 'text-gray-400'}`}>
                                    {dl.overdue ? '⚠ ' : ''}{dl.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] font-semibold text-gray-800 leading-snug mb-1">{task.title}</p>
                              {task.description && (
                                <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{task.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop: horizontal kanban grid ── */}
              <div className="hidden md:grid grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.key);
                  const isOver = dragOver === col.key;
                  return (
                    <div
                      key={col.key}
                      onDragOver={(e) => onDragOver(e, col.key)}
                      onDrop={(e) => onDrop(e, col.key)}
                      onDragLeave={() => setDragOver(null)}
                      className={`flex flex-col min-h-[400px] rounded-2xl border transition-colors ${isOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-gray-50/60'}`}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${col.color}`} />
                          <span className="text-[12px] font-semibold text-gray-700">{col.label}</span>
                          <span className="text-[11px] text-gray-400 font-medium">{counts[col.key]}</span>
                        </div>
                        <button
                          onClick={() => openAdd(col.key)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 p-3 flex-1">
                        {colTasks.length === 0 && (
                          <div className="flex items-center justify-center flex-1 text-[12px] text-gray-300 select-none">Drop here</div>
                        )}
                        {colTasks.map((task) => {
                          const pr = priorityMeta(task.priority);
                          const dl = formatDeadline(task.deadline);
                          const isDragging = dragId === task.id;
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => onDragStart(e, task.id)}
                              onDragEnd={onDragEnd}
                              onClick={() => openEdit(task)}
                              className={`bg-white rounded-xl border border-gray-200 px-3.5 py-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all select-none ${isDragging ? 'opacity-40' : ''}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${pr.bg} ${pr.text}`}>
                                  {pr.label}
                                </span>
                                {dl && (
                                  <span className={`text-[10px] font-medium ${dl.overdue ? 'text-red-500' : dl.soon ? 'text-amber-500' : 'text-gray-400'}`}>
                                    {dl.overdue ? '⚠ ' : ''}{dl.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] font-semibold text-gray-800 leading-snug mb-1">{task.title}</p>
                              {task.description && (
                                <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{task.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Notes panel */}
        <div className="w-full lg:w-72 lg:shrink-0 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4 lg:mb-0 h-[272px] lg:h-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-[12px] font-semibold text-gray-700">Notes</span>
            </div>
            <span className={`text-[10px] font-medium transition-colors ${notesSaved ? 'text-gray-300' : 'text-amber-400'}`}>
              {notesSaved ? 'Saved' : 'Saving…'}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Write notes, ideas, reminders…"
            className="flex-1 w-full px-4 py-3 text-[13px] text-gray-700 placeholder:text-gray-300 leading-relaxed resize-none focus:outline-none"
          />
        </div>

      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-gray-900">
                {modal.mode === 'add' ? 'New task' : 'Edit task'}
              </h2>
              <button onClick={closeModal} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title *</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="Task title"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details…"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                />
              </div>

              {/* Priority + Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Column</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              {modal.mode === 'edit' ? (
                <button
                  onClick={handleDelete}
                  className="text-[12px] font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  Delete task
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  {saving ? 'Saving…' : modal.mode === 'add' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
