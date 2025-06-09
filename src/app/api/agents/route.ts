"use server";
import { NextResponse } from "next/server";
import { selectAgentListByUserIdAction } from "@/app/api/chat/actions";

export async function GET() {
  try {
    const agents = await selectAgentListByUserIdAction();
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}
