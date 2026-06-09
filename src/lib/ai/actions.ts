"use server";

import OpenAI from "openai";

export async function generateProductDescription(name: string, categoryName?: string) {
  if (!name || name.length < 2) {
    return { success: false, error: "El nombre del producto es demasiado corto." };
  }

  const apiKey = process.env.OPENAI_API_KEY || (process.env.NODE_ENV === "test" ? "mock-key" : undefined);
  if (!apiKey) {
    return { success: false, error: "Credenciales de IA no configuradas (falta OPENAI_API_KEY)." };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const prompt = `Actúa como un experto en marketing gastronómico y ventas. 
    Escribe una descripción corta, provocativa y vendedora para un producto llamado "${name}"${categoryName ? ` de la categoría "${categoryName}"` : ""}. 
    La descripción debe tener máximo 2 frases y sonar natural para el público ecuatoriano. 
    No uses hashtags. No incluyas el nombre del producto en la descripción.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Upgrade sugerido por GGA para mejor performance y costo
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    const description = response.choices[0]?.message?.content?.trim();

    if (!description) {
      return { success: false, error: "No se pudo generar la descripción." };
    }

    return { success: true, description };
  } catch (error) {
    console.error("AI Error:", error);
    return { success: false, error: "Error al conectar con la IA." };
  }
}
