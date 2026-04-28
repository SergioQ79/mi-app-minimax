"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const initialMessage: Message = {
    role: "assistant",
    content:
      "Hola Sergio. Esta app responde solamente usando el texto cargado como conocimiento. Preguntame algo sobre ese tema.",
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("minimax/minimax-m2.5:free");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();

    const text = input.trim();

    if (!text || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.detalle || data?.detail || data?.error || "Error desconocido"
        );
      }

      setModel(data.model || "minimax/minimax-m2.5:free");

      const assistantAnswer =
        data.response || data.answer || data.message || "No recibí respuesta.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantAnswer,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Tuve un problema al consultar MiniMax. Detalle: " +
            (error?.message || "Error desconocido"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function limpiarChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat reiniciado. Preguntame algo sobre el texto cargado como conocimiento.",
      },
    ]);
  }

  return (
    <main className="page">
      <section className="chatShell">
        <header className="header">
          <div>
            <p className="eyebrow">Demo IA</p>
            <h1>MiniMax M2.5 Free</h1>
            <p className="subtitle">
              Responde solamente usando el texto cargado
            </p>
          </div>

          <div className="headerActions">
            <span className="status">
              <span className="dot" />
              Online
            </span>

            <button className="smallButton" onClick={limpiarChat} type="button">
              Limpiar
            </button>
          </div>
        </header>

        <div className="modelBar">
          <span>Modelo activo:</span>
          <strong>{model}</strong>
        </div>

        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.role === "user" ? "userMessage" : "assistantMessage"
              }`}
            >
              <span className="label">
                {msg.role === "user" ? "Vos" : "MiniMax"}
              </span>
              <p>{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div className="message assistantMessage">
              <span className="label">MiniMax</span>
              <p>Escribiendo...</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu pregunta..."
            autoComplete="off"
          />

          <button disabled={loading || !input.trim()} type="submit">
            {loading ? "..." : "Enviar"}
          </button>
        </form>
      </section>
    </main>
  );
}