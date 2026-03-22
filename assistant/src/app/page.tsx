"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Page() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  async function sendMessage() {
    if (!input.trim()) return;

    const next: Message[] = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");

    const res = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: next }),
    });

    const data = await res.json();

    setMessages([
      ...next,
      {
        role: "assistant",
        content: data.reply ?? "Keine Antwort erhalten.",
      },
    ]);
  }

  return (
    <main>
      <h1>FootballGenius</h1>

      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Nachricht eingeben"
      />
      <button onClick={sendMessage}>Senden</button>
    </main>
  );
}