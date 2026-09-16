import { useState, useEffect } from 'react';
import { Send, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getVendorServiceRequests, getVendorServiceMessages, sendVendorServiceMessage } from '../../services/api';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const requests = await getVendorServiceRequests();
        setConversations(requests);
        if (requests.length > 0) setActiveId(requests[0].id);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    getVendorServiceMessages(activeId).then(setMessages).catch(() => setMessages([]));
  }, [activeId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    try {
      const message = await sendVendorServiceMessage(activeId, input.trim());
      setMessages((prev) => [...prev, message]);
      setInput('');
    } catch {
      window.alert('Could not send message. Please try again.');
    }
  };

  const filtered = conversations.filter((c) =>
    (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-slate-500">Loading conversations…</p>;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white border border-blue-100 rounded-xl overflow-hidden">
      <div className="w-72 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-blue-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center mt-8 px-4">No customer conversations yet.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-blue-50 transition ${
                activeId === c.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-blue-900">{c.city || 'Customer'}</span>
                <span className="text-xs text-slate-400">{c.service_type}</span>
              </div>
              <p className="text-xs mt-1 truncate text-slate-500">{c.description || 'No description'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeId ? (
          <>
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-blue-900">Conversation #{activeId}</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-slate-400 text-center mt-8">No messages yet — say hello!</p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                    m.sender_id === user.id
                      ? 'bg-blue-900 text-white ml-auto'
                      : 'bg-blue-50 text-slate-700'
                  }`}
                >
                  {m.message}
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-200 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <button type="submit" className="bg-blue-900 text-white rounded-lg px-4 py-2 hover:bg-blue-800">
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}