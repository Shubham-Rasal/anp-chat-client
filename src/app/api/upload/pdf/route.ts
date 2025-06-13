import { NextResponse } from "next/server";
import { streamText } from "ai";
import { customModelProvider } from "@/lib/ai/models";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Increase payload size limit for PDF files (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userMessage =
      (formData.get("message") as string) ||
      "Please analyze this PDF and provide a summary.";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 },
      );
    }

    // Convert file to base64 for transmission
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileArrayBuffer).toString("base64");

    // Create messages array with the PDF attachment
    const messages = [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: userMessage,
          },
          {
            type: "file" as const,
            data: fileBase64,
            mimeType: "application/pdf",
          },
        ],
      },
    ];

    // Stream the response using the AI model
    // Use Claude 3.7 Sonnet which has good PDF understanding capabilities
    const result = streamText({
      model: customModelProvider.getModel("claude-3-7-sonnet"),
      messages,
      maxSteps: 3, // Allow multiple steps for complex analysis
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF file" },
      { status: 500 },
    );
  }
}
