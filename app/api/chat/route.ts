import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const models = Array.from(
  new Set(
    [
      process.env.OPENROUTER_MODEL || "minimax/minimax-m2.5:free",
      process.env.OPENROUTER_FALLBACK_MODEL || "deepseek/deepseek-chat-v3.1:free",
      "openrouter/free",
    ].filter(Boolean)
  )
);

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  maxRetries: 0,
  timeout: 20000,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
    "X-Title": "Mi App IA",
  },
});

let conocimientoCache: string | null = null;

async function getConocimiento() {
  if (conocimientoCache) return conocimientoCache;

  const filePath = path.join(process.cwd(), "data", "conocimiento.txt");

  try {
    conocimientoCache = await readFile(filePath, "utf8");
    return conocimientoCache;
  } catch (error) {
    console.error("No se encontró conocimiento.txt:", filePath);
    throw new Error(
      "No se encontró el archivo data/conocimiento.txt en la raíz del proyecto."
    );
  }
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tiene(texto: string, palabras: string[]) {
  const limpio = normalizar(texto);
  return palabras.some((p) => limpio.includes(normalizar(p)));
}

function tieneTodas(texto: string, palabras: string[]) {
  const limpio = normalizar(texto);
  return palabras.every((p) => limpio.includes(normalizar(p)));
}

function respuestaRapida(pregunta: string): string | null {
  const q = normalizar(pregunta);

  if (
    tieneTodas(q, ["vacacion"]) &&
    tiene(q, ["cobre menos", "cobré menos", "depositaron menos", "sueldo parcial", "pago parcial", "liquidacion parcial"])
  ) {
    return "Puede ser normal que el sueldo posterior a las vacaciones figure menor o parcial, porque los días de vacaciones ya fueron liquidados previamente. En el sueldo mensual se pagan solo los días efectivamente trabajados.";
  }

  if (
    tiene(q, ["vacacion"]) &&
    tiene(q, ["quien define", "quién define", "quien decide", "quién decide"])
  ) {
    return "Las fechas de vacaciones son definidas exclusivamente por la empresa según las necesidades operativas.";
  }

  if (
    tiene(q, ["vacacion"]) &&
    tiene(q, ["cambiar", "modificar", "cambio de fecha"])
  ) {
    return "Las vacaciones no pueden modificarse, salvo casos de fuerza mayor.";
  }

  if (
    tiene(q, ["vacacion"]) &&
    tiene(q, ["hasta cuando", "30 de abril", "vencen"])
  ) {
    return "Las vacaciones deben tomarse antes del 30 de abril. Si no se toman antes de esa fecha, se consideran perdidas.";
  }

  if (
    tiene(q, ["vacacion"]) &&
    tiene(q, ["cuantos dias antes", "cuántos días antes", "anticipacion", "anticipación"])
  ) {
    return "Las fechas de vacaciones las define la empresa. Si el empleado no puede tomarlas en la fecha asignada, debe avisar a RRHH con al menos 30 días de anticipación.";
  }

  if (
    tiene(q, ["vacacion"]) &&
    tiene(q, ["inicio del descanso", "al inicio", "cuando se paga"])
  ) {
    return "La retribución correspondiente al período de vacaciones debe abonarse al inicio del descanso.";
  }

  if (
    tiene(q, ["vacacion"]) &&
    tiene(q, ["recibo separado", "recibo unico", "recibo único"])
  ) {
    return "El pago de vacaciones debe constar en recibo separado o en recibo único si existiera autorización administrativa.";
  }

  if (
    tiene(q, ["aumento", "ajuste salarial", "aumentos"]) &&
    tiene(q, ["vacacion", "mes parcial", "parcial"])
  ) {
    return "Si hubo aumentos o ajustes salariales, la liquidación se actualiza con los valores vigentes, aunque el mes haya sido trabajado de forma parcial.";
  }

  if (tiene(q, ["no laborable", "dias no laborables", "días no laborables"])) {
    return "Todos los días no laborables se trabajan normalmente, salvo casos de fuerza mayor debidamente justificados o indicación expresa de la empresa.";
  }

  if (tiene(q, ["permiso", "ausencia", "faltar", "autorizacion", "autorización"])) {
    return "Toda solicitud de ausencia debe enviarse únicamente por correo electrónico a RRHH. Solo se consideran válidas las autorizaciones confirmadas por ese mismo medio.";
  }

  if (tiene(q, ["visita", "visitas"]) && tiene(q, ["vivienda", "casa"])) {
    return "No se permiten visitas en la vivienda provista por la empresa.";
  }

  if (
    tiene(q, ["fiesta", "reunion", "reunión"]) &&
    tiene(q, ["vivienda", "casa"])
  ) {
    return "No se permiten reuniones ni fiestas en la vivienda provista por la empresa.";
  }

  if (
    tiene(q, ["rompo", "romper", "daño", "danio", "irregularidad"]) &&
    tiene(q, ["vivienda", "casa"])
  ) {
    return "Todo daño o irregularidad en la vivienda debe reportarse inmediatamente. Los daños ocasionados pueden ser descontados del salario.";
  }

  if (
    tiene(q, ["vehiculo", "vehículo", "auto", "camioneta"]) &&
    tiene(q, ["personal", "uso personal"])
  ) {
    return "Los vehículos de la empresa son solo para fines laborales. Está prohibido el uso personal sin autorización.";
  }

  if (
    tiene(q, ["vehiculo", "vehículo", "auto", "camioneta"]) &&
    tiene(q, ["falla", "anomalia", "anomalía", "problema"])
  ) {
    return "Cualquier falla o anomalía del vehículo debe informarse inmediatamente.";
  }

  if (
    tiene(q, ["vehiculo", "vehículo", "auto", "camioneta"]) &&
    tiene(q, ["accidente", "choque", "multa", "control policial"])
  ) {
    return "Todo accidente, choque, multa o control policial con un vehículo de la empresa debe informarse inmediatamente al supervisor.";
  }

  if (tiene(q, ["adelanto", "adelanto de sueldo"])) {
    return "La empresa no otorga adelantos de sueldo, salvo casos de emergencia. Para solicitarlo se debe enviar un mail a Tesorería con copia a RRHH, indicando el monto solicitado y los motivos del pedido.";
  }

  if (tiene(q, ["recibo de sueldo", "recibo"])) {
    return "El recibo de sueldo estará disponible a partir de las 72 horas hábiles desde la fecha de cobro.";
  }

  return null;
}

function seleccionarContexto(pregunta: string, conocimiento: string) {
  const q = normalizar(pregunta);
  const secciones = conocimiento
    .split(/(?=^##\s+)/gm)
    .map((s) => s.trim())
    .filter(Boolean);

  const bloques: string[] = [];

  function buscarSeccion(palabrasTitulo: string[]) {
    return secciones.find((seccion) => {
      const titulo = seccion.split("\n")[0] || "";
      return palabrasTitulo.every((p) => normalizar(titulo).includes(normalizar(p)));
    });
  }

  function agregarSecciones(grupos: string[][]) {
    for (const grupo of grupos) {
      const bloque = buscarSeccion(grupo);
      if (bloque && !bloques.includes(bloque)) {
        bloques.push(bloque);
      }
    }
  }

  function agregarSiCoincide(palabras: string[], grupos: string[][]) {
    if (palabras.some((p) => q.includes(normalizar(p)))) {
      agregarSecciones(grupos);
    }
  }

  agregarSiCoincide(
    ["vacacion", "vacaciones", "licencia", "descanso"],
    [
      ["vacaciones"],
      ["liquidacion", "sueldo", "vacaciones"],
      ["consultas", "vacaciones", "sueldo"],
    ]
  );

  agregarSiCoincide(
    ["sueldo", "cobre", "cobré", "depositaron", "deposito", "depósito", "parcial", "liquidacion", "liquidación", "aumento"],
    [
      ["liquidacion", "sueldo", "vacaciones"],
      ["consultas", "vacaciones", "sueldo"],
      ["recibo", "sueldo"],
      ["adelanto", "sueldo"],
    ]
  );

  agregarSiCoincide(
    ["no laborable", "feriado"],
    [["dias", "no", "laborables"]]
  );

  agregarSiCoincide(
    ["ausencia", "permiso", "autorizacion", "autorización", "faltar"],
    [["permisos", "ausencia"]]
  );

  agregarSiCoincide(
    ["droga", "alcohol", "medicamento", "sustancia"],
    [["drogas", "alcohol"]]
  );

  agregarSiCoincide(
    ["vivienda", "casa", "visita", "fiesta", "reunion", "reunión", "rompo", "romper", "daño", "danio"],
    [["uso", "vivienda"]]
  );

  agregarSiCoincide(
    ["vehiculo", "vehículo", "auto", "camioneta", "multa", "choque", "accidente", "control policial", "falla"],
    [["uso", "vehiculos"]]
  );

  agregarSiCoincide(
    ["adelanto", "emergencia", "tesoreria", "tesorería"],
    [["adelanto", "sueldo"]]
  );

  agregarSiCoincide(
    ["recibo"],
    [["recibo", "sueldo"]]
  );

  agregarSecciones([
    ["aclaracion", "final"],
    ["criterio", "respuesta"],
  ]);

  if (bloques.length === 0) {
    return conocimiento;
  }

  return bloques.join("\n\n");
}

async function consultarModelo(model: string, message: string, contexto: string) {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `
Sos un asistente especializado en políticas internas de RRHH.

Tenés que responder EXCLUSIVAMENTE usando el texto proporcionado en "CONOCIMIENTO".

Reglas obligatorias:
1. No inventes información.
2. No uses conocimiento externo.
3. No respondas sobre temas que no estén en el conocimiento.
4. Si la respuesta no está claramente en el texto, respondé:
"No tengo esa información en las políticas disponibles. Consultá con RRHH."
5. Respondé en español.
6. Respondé de forma clara, breve y profesional.
7. Si la pregunta menciona sueldo, depósito, pago parcial, liquidación o vacaciones ya pagadas, priorizá la información sobre liquidación de sueldo después de vacaciones.

CONOCIMIENTO:
${contexto}
        `.trim(),
      },
      {
        role: "user",
        content: message,
      },
    ],
    temperature: 0,
    max_tokens: 180,
  });

  return completion.choices[0]?.message?.content || "No pude generar una respuesta.";
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: "Falta configurar OPENROUTER_API_KEY en .env.local",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const message =
      body.message ||
      body.prompt ||
      body.question ||
      body.text ||
      body.content;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          error: "Mensaje inválido",
          detalle: "El frontend debe enviar { message: 'tu pregunta' }",
        },
        { status: 400 }
      );
    }

    const rapida = respuestaRapida(message);

    if (rapida) {
      return NextResponse.json({
        response: rapida,
        model: "respuesta-directa",
      });
    }

    const conocimiento = await getConocimiento();
    const contexto = seleccionarContexto(message, conocimiento);

    let ultimoError: any = null;

    for (const model of models) {
      try {
        const respuesta = await consultarModelo(model, message, contexto);

        return NextResponse.json({
          response: respuesta,
          model,
        });
      } catch (error: any) {
        ultimoError = error;
        console.error(`Error usando modelo ${model}:`, error?.message || error);
      }
    }

    console.error("Todos los modelos fallaron:", ultimoError);

    return NextResponse.json(
      {
        error: "No se pudo obtener respuesta del modelo.",
        detalle:
          ultimoError?.message ||
          "Los modelos gratuitos pueden estar temporalmente limitados.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error en /api/chat:", error);

    return NextResponse.json(
      {
        error: "Error procesando la consulta.",
        detalle: error?.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}