"use client";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Subtema = {
  label: string;
  text: string;
};

type Tema = {
  label: string;
  subtemas: Subtema[];
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hola Sergio 👋 Soy tu asistente de RRHH. Elegí un tema o escribime tu consulta sobre las políticas internas de la empresa.",
};

const temas: Tema[] = [
  {
    label: "Vacaciones",
    subtemas: [
      {
        label: "Quién las define",
        text: "¿Quién define mis vacaciones?",
      },
      {
        label: "Cambiar fecha",
        text: "¿Puedo cambiar la fecha de mis vacaciones?",
      },
      {
        label: "Fecha límite",
        text: "¿Hasta cuándo tengo tiempo para tomarme las vacaciones?",
      },
      {
        label: "30 de abril",
        text: "¿Qué pasa si no me tomo las vacaciones antes del 30 de abril?",
      },
      {
        label: "Aviso previo",
        text: "¿Con cuánta anticipación debo avisar si no puedo tomarme las vacaciones asignadas?",
      },
    ],
  },
  {
    label: "Sueldo",
    subtemas: [
      {
        label: "Cobré menos",
        text: "¿Por qué cobré menos después de mis vacaciones?",
      },
      {
        label: "Sueldo parcial",
        text: "¿Por qué el sueldo vino parcial si ya me pagaron las vacaciones?",
      },
      {
        label: "Depósito menor",
        text: "¿Por qué me depositaron menos después de salir de vacaciones?",
      },
      {
        label: "Aumentos",
        text: "¿Los aumentos salariales se aplican aunque el mes sea parcial?",
      },
      {
        label: "Revisar liquidación",
        text: "¿Cómo reviso si la liquidación de vacaciones está bien hecha?",
      },
    ],
  },
  {
    label: "Ausencias",
    subtemas: [
      {
        label: "Pedir permiso",
        text: "¿Cómo pido permiso o una ausencia?",
      },
      {
        label: "Medio válido",
        text: "¿Por qué medio tengo que pedir autorización?",
      },
      {
        label: "Días no laborables",
        text: "¿Los días no laborables se trabajan?",
      },
    ],
  },
  {
    label: "Vivienda",
    subtemas: [
      {
        label: "Visitas",
        text: "¿Se permiten visitas en la vivienda de la empresa?",
      },
      {
        label: "Fiestas",
        text: "¿Puedo hacer reuniones o fiestas en la vivienda?",
      },
      {
        label: "Daños",
        text: "¿Qué pasa si rompo algo en la vivienda?",
      },
      {
        label: "Devolución",
        text: "¿Cuándo debo devolver la vivienda de la empresa?",
      },
    ],
  },
  {
    label: "Vehículos",
    subtemas: [
      {
        label: "Uso personal",
        text: "¿Puedo usar un vehículo de la empresa para algo personal?",
      },
      {
        label: "Falla",
        text: "¿Qué tengo que hacer si el vehículo tiene una falla?",
      },
      {
        label: "Accidente",
        text: "¿Qué hago si tengo un accidente con un vehículo de la empresa?",
      },
      {
        label: "Multa/control",
        text: "¿Qué hago si tengo una multa o un control policial con un vehículo de la empresa?",
      },
    ],
  },
  {
    label: "Adelantos",
    subtemas: [
      {
        label: "Pedir adelanto",
        text: "¿La empresa da adelantos de sueldo?",
      },
      {
        label: "Emergencia",
        text: "¿Cómo solicito un adelanto por emergencia?",
      },
    ],
  },
  {
    label: "Recibo",
    subtemas: [
      {
        label: "Disponibilidad",
        text: "¿Cuándo va a estar disponible mi recibo de sueldo?",
      },
    ],
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("openrouter/free");
  const [temaActivo, setTemaActivo] = useState(temas[0].label);

  const chatContentRef = useRef<HTMLDivElement | null>(null);
  const chipLockRef = useRef(false);

  const temaSeleccionado =
    temas.find((tema) => tema.label === temaActivo) || temas[0];

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

  function tocarSubtema(texto: string) {
    if (loading || chipLockRef.current) return;

    chipLockRef.current = true;

    enviarTexto(texto);

    window.setTimeout(() => {
      chipLockRef.current = false;
    }, 700);
  }

  function seleccionarTema(label: string) {
    if (loading) return;
    setTemaActivo(label);
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
          "Chat reiniciado 👋 Elegí un tema o preguntame algo sobre las políticas internas de RRHH.",
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
          {temas.map((tema) => (
            <button
              key={tema.label}
              type="button"
              className={`topicChip ${
                temaActivo === tema.label ? "topicChipActive" : ""
              }`}
              disabled={loading}
              onClick={() => seleccionarTema(tema.label)}
            >
              {tema.label}
            </button>
          ))}
        </div>

        <div className="subtopicsBar">
          {temaSeleccionado.subtemas.map((subtema) => (
            <button
              key={subtema.label}
              type="button"
              className="subtopicChip"
              disabled={loading}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                tocarSubtema(subtema.text);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                tocarSubtema(subtema.text);
              }}
            >
              {subtema.label}
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