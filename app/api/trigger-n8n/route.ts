import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { jobId, webhookUrl } = await request.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: "Missing webhookUrl" }, { status: 400 });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });

    const data = await response.text();

    return NextResponse.json({ 
      success: response.ok, 
      status: response.status,
      details: data 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}