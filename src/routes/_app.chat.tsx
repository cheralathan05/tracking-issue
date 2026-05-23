import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { listComplaints } from "@/lib/smartgov-api";

type ChatMessage = {
  id: string;
  senderId: string;
  message: string | null;
  messageType: string;
  attachment?: any;
  createdAt: string;
};

export const Route = createFileRoute("/_app/chat")({
  component: () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState("");
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      let mounted = true;

      async function load() {
        try {
          // try assigned first, fallback to mine
          try {
            const res = await listComplaints({ view: "assigned" as any });
            if (mounted) setComplaints(res.complaints);
          } catch (e) {
            const res = await listComplaints({ view: "mine" });
            if (mounted) setComplaints(res.complaints);
          }
        } catch (err) {
          // ignore
        } finally {
          if (mounted) setLoading(false);
        }
      }

      load();

      return () => {
        mounted = false;
      };
    }, []);

    useEffect(() => {
      const socket = io({ withCredentials: true });
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
        console.error("Socket connect error", err);
      });

      socket.on("message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      return () => {
        socket.disconnect();
      };
    }, []);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openChatForComplaint = async (complaint: any) => {
      setSelected(complaint);
      try {
        const resp = await fetch(`/api/chat/rooms/complaint/${encodeURIComponent(complaint.id)}`, { method: "POST", credentials: "include" });
        const payload = await resp.json();
        const room = payload.room;
        setRoomId(room.id);
        setMessages([]);

        // join room via socket
        socketRef.current?.emit("joinRoom", room.id);

        // fetch messages
        const msgsRes = await fetch(`/api/chat/rooms/${encodeURIComponent(room.id)}/messages?limit=100`, { credentials: "include" });
        const msgsJson = await msgsRes.json();
        if (msgsJson?.messages) setMessages(msgsJson.messages as ChatMessage[]);
      } catch (err) {
        console.error(err);
      }
    };

    const sendMessage = () => {
      if (!roomId || !text.trim()) return;
      socketRef.current?.emit("sendMessage", { roomId, message: text.trim(), messageType: "text" });
      setText("");
    };

    const handleFile = async (file: File | null) => {
      if (!file || !roomId) return;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/upload`, { method: "POST", body: fd, credentials: "include" });
      const json = await res.json();
      if (json?.fileUrl) {
        socketRef.current?.emit("sendMessage", { roomId, message: null, messageType: "attachment", attachment: { fileUrl: json.fileUrl, fileType: file.type } });
      }
    };

    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold">Complaints</h3>
            {loading ? (
              <div className="mt-4 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {complaints.map((c) => (
                  <li key={c.id} className={`p-3 cursor-pointer ${selected?.id === c.id ? "bg-primary/5" : ""}`} onClick={() => openChatForComplaint(c)}>
                    <div className="font-mono text-xs text-muted-foreground">{c.grievanceId}</div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.city} · {c.department}</div>
                  </li>
                ))}
                {complaints.length === 0 && <li className="p-3 text-sm text-muted-foreground">No complaints found.</li>}
              </ul>
            )}
          </div>
        </div>

        <div className="col-span-6">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col h-[70vh]">
            <div className="mb-3">
              <h3 className="font-semibold">{selected ? `Chat — ${selected.title}` : "Open a complaint to start chat"}</h3>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {messages.map((m) => (
                <div key={m.id} className="mb-3">
                  <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
                  {m.message ? <div className="mt-1">{m.message}</div> : null}
                  {m.attachment?.fileUrl ? (
                    <div className="mt-1">
                      <a href={m.attachment.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline">View attachment</a>
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <input className="flex-1 rounded-md border px-3 py-2" placeholder="Type a message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} />
                <label className="inline-flex items-center">
                  <input type="file" className="hidden" onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)} />
                  <Button>Attach</Button>
                </label>
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold">Complaint Info</h3>
            {selected ? (
              <div className="mt-3 text-sm text-muted-foreground">
                <div><strong>ID:</strong> {selected.grievanceId}</div>
                <div><strong>Reporter:</strong> {selected.reporterName}</div>
                <div><strong>Assigned:</strong> {selected.assignedOfficerName ?? '—'}</div>
                <div className="mt-2"><strong>Description</strong><div className="mt-1 text-xs text-muted-foreground">{selected.description}</div></div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">Select a complaint to view details.</div>
            )}
          </div>
        </div>
      </div>
    );
  },
});
