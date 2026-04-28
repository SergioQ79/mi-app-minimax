"use client";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hola Sergio 👋 Soy tu asistente de RRHH. Respondeme preguntas sobre las políticas internas de la empresa.",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("openrouter/free");

  const chatContentRef = useRef<HTMLDivElement | null>(null);
  const chipLockRef = useRef(false);

  const sugerencias = [
    {
      label: "Vacaciones",
      text: "¿Quién define mis vacaciones?",
    },
    {
      label: "Sueldo",
      text: "¿Por qué cobré menos después de vacaciones?",
    },
    {
      label: "Ausencias",
      text: "¿Cómo pido permiso de ausencia?",
    },
    {
      label: "Recibo",
      text: "¿Cuándo está disponible mi recibo?",
    },
  ];

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const container = chatContentRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }

  useLayoutEffect(() => {
    scrollToBottom("auto");
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });

    return () => cancelAnimationFrame(id);
  }, [messages, loading]);

  async function enviarTexto(texto: string) {
    const text = texto.trim();

    if (!text || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });

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

      setModel(data.model || "openrouter/free");

      const assistantAnswer =
        data.response || data.answer || data.message || "No recibí respuesta.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantAnswer,
        },
      ]);

      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Tuve un problema al procesar la consulta. Detalle: " +
            (error?.message || "Error desconocido"),
        },
      ]);

      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    } finally {
      setLoading(false);
    }
  }

  function tocarChip(texto: string) {
    if (loading || chipLockRef.current) return;

    chipLockRef.current = true;

    enviarTexto(texto);

    window.setTimeout(() => {
      chipLockRef.current = false;
    }, 700);
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    await enviarTexto(input);
  }

  function limpiarChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat reiniciado 👋 Preguntame algo sobre las políticas internas de RRHH.",
      },
    ]);

    setInput("");
    setLoading(false);

    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  }

  return (
    <main className="androidPage">
      <section className="phoneApp">
        <header className="appHeader">
          <div className="profileArea">
            <div className="avatarRing">
              <div className="avatar">RR</div>
            </div>

            <div className="profileText">
              <h1>RRHH Assistant</h1>
              <p>
                <span className="onlineDot" />
                Online · Políticas internas
              </p>
            </div>
          </div>

          <button className="clearButton" onClick={limpiarChat} type="button">
            Limpiar
          </button>
        </header>

        <div className="storiesBar">
          {sugerencias.map((sugerencia) => (
            <button
              key={sugerencia.label}
              className="suggestionChip"
              type="button"
              disabled={loading}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                tocarChip(sugerencia.text);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                tocarChip(sugerencia.text);
              }}
            >
              {sugerencia.label}
            </button>
          ))}
        </div>

        <div className="modelInfo">
          <span>Modelo activo</span>
          <strong>{model}</strong>
        </div>

        <div className="chatContent" ref={chatContentRef}>
          <div className="datePill">Hoy</div>

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chatRow ${
                msg.role === "user" ? "chatRowUser" : "chatRowAssistant"
              }`}
            >
              {msg.role === "assistant" && <div className="miniAvatar">RR</div>}

              <div
                className={`bubble ${
                  msg.role === "user" ? "bubbleUser" : "bubbleAssistant"
                }`}
              >
                <p>{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chatRow chatRowAssistant">
              <div className="miniAvatar">RR</div>

              <div className="bubble bubbleAssistant typingBubble">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        <form className="bottomComposer" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí un mensaje..."
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