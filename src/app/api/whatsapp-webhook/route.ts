// src/app/api/whatsapp-webhook/route.ts
// This API route was previously used for the WhatsApp chatbot webhook.
// It is no longer active as the chatbot functionality has been removed.

import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.warn('DEPRECATED: WhatsApp webhook GET endpoint called, but chatbot functionality is removed.');
  return new NextResponse('Chatbot functionality removed. This endpoint is inactive.', { status: 410 }); // 410 Gone
}

export async function POST(request: NextRequest) {
  console.warn('DEPRECATED: WhatsApp webhook POST endpoint called, but chatbot functionality is removed.');
  return NextResponse.json({ status: 'Chatbot functionality removed. Endpoint inactive.' }, { status: 410 }); // 410 Gone
}
