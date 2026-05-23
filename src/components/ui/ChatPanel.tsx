import React, { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

type Conversation = {
  id: string;
  title: string;
  lastMessage?: string;
};

export function ChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Minimal: load user's complaints as conversations (caller can replace with real API)
    async function load() {
      try {
        const res = await fetch(`/api/complaints`);
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.complaints || []).map((c: any) => ({ id: c.id, title: c.title, lastMessage: "" }));
        setConversations(list);
        if (list.length) setActive(list[0].id);
      } catch (e) {
        // ignore
      }
    }

    void load();
  }, []);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 320, borderRight: "1px solid #e5e7eb", padding: 12 }}>
        <h3>Conversations</h3>
        {conversations.map((c) => (
          <div key={c.id} onClick={() => setActive(c.id)} style={{ padding: 8, cursor: "pointer", background: active === c.id ? "#f3f4f6" : "transparent" }}>
            <div style={{ fontWeight: 600 }}>{c.title}</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{c.lastMessage}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        {active ? <ChatWindow complaintId={active} /> : <div style={{ padding: 20 }}>Select a conversation</div>}
      </div>
    </div>
  );
}

function ChatWindow({ complaintId }: { complaintId: string }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const { socketRef, emit } = useSocket();

  useEffect(() => {
    if (!complaintId) return;
    async function init() {
      const res = await fetch(`/api/chat/rooms/complaint/${complaintId}`, { method: "POST" });
      const data = await res.json();
      setRoomId(data.room.id);
    }
    void init();
  }, [complaintId]);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    async function load() {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      const data = await res.json();
      if (mounted) setMessages(data.messages || []);
    }
    void load();
    const s = socketRef.current;
    if (s) {
      emit("joinRoom", roomId);
      s.on("message", (msg: any) => {
        setMessages((m) => [...m, msg]);
      });
    }
    return () => {
      mounted = false;
      if (s) {
        emit("leaveRoom", roomId);
        s.off("message");
      }
    };
  }, [roomId]);

  async function send() {
    if (!roomId || !text.trim()) return;
    const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    setMessages((m) => [...m, data.message]);
    setText("");
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ margin: "8px 0" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{msg.senderId}</div>
            <div style={{ padding: 8, background: "#f3f4f6", borderRadius: 8 }}>{msg.message || (msg.attachment && msg.attachment.fileUrl)}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(msg.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid #e5e7eb" }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} style={{ width: "100%" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={send} style={{ padding: "8px 12px" }}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
