import { NextResponse } from 'next/server';
import { generateNarrative } from '@/lib/ai/ollama';
import type { CategoryResult } from '@/lib/ai/ollama';

export async function POST(request: Request) {
  try {
    const { bullets, rankLevel, dutyTitle, evaluationType, style } = await request.json();

    if (!bullets || !rankLevel || !dutyTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate narrative with AI using proper NCOER/OER language
    const narrative = await generateNarrative(
      bullets as CategoryResult[],
      rankLevel,
      dutyTitle,
      evaluationType || 'NCOER',
      style || 'concise'
    );
    return NextResponse.json({ narrative });
  } catch (error: any) {
    console.error('AI narrative error:', error);
    return NextResponse.json(
      { error: 'AI processing failed. Make sure Ollama is running.' },
      { status: 500 }
    );
  }
}

