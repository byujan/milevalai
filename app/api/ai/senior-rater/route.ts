import { NextResponse } from 'next/server';
import { generateSeniorRaterComments } from '@/lib/ai/ollama';

export async function POST(request: Request) {
  try {
    const { raterComments, bullets, rankLevel, evaluationType } = await request.json();

    if (!raterComments || !bullets || !Array.isArray(bullets)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate senior rater comments with AI using proper NCOER/OER language
    const comments = await generateSeniorRaterComments(
      raterComments,
      bullets,
      rankLevel,
      evaluationType || 'NCOER'
    );

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('AI senior rater comments error:', error);
    return NextResponse.json(
      { error: 'AI processing failed. Make sure Ollama is running.' },
      { status: 500 }
    );
  }
}

