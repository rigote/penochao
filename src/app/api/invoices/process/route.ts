import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceData } from "@/lib/gemini";

// Use unpdf (based on pdf-parse but without initialization bugs)
import { extractText } from "unpdf";

// Helper to parse PDF using unpdf
const parsePdf = async (buffer: Buffer) => {
  // unpdf requires Uint8Array, not Buffer
  const uint8Array = new Uint8Array(buffer);
  const result = await extractText(uint8Array);

  // unpdf returns { totalPages, text } where text is array of strings (one per page)
  if (result && result.text && Array.isArray(result.text)) {
    return result.text.join('\n\n'); // Join pages with double newline
  }

  return '';
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert file to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    let text = "";
    try {
      const pages = await parsePdf(buffer);
      // unpdf returns array of strings (one per page), join them
      text = Array.isArray(pages) ? pages.join('\n') : String(pages);
    } catch (e) {
      console.error("PDF Parsing logic failed:", e);
      return NextResponse.json({ error: "Failed to read PDF file content" }, { status: 422 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. It might be an image-only PDF." },
        { status: 422 }
      );
    }

    // Extract structured data using Gemini
    const data = await extractInvoiceData(text);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "Failed to process invoice" },
      { status: 500 }
    );
  }
}
