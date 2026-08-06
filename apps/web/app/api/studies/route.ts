import { NextResponse } from "next/server";

export async function GET() {

    return NextResponse.json([
        {
            id: "1",
            title: "Romans 8 Study",
            passage: "Romans 8:1–39",
            status: "Draft",
        },
    ]);

}