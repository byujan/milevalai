import { NextResponse } from 'next/server';
import { extractAdminDataFromPredecessor } from '@/lib/ai/ollama';

export async function POST(request: Request) {
  try {
    const { text, evaluationId } = await request.json();

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: 'Text is required and must be at least 50 characters' },
        { status: 400 }
      );
    }

    console.log(`📄 Extracting admin data from predecessor for evaluation ${evaluationId}`);

    // Extract structured admin data using AI
    const adminData = await extractAdminDataFromPredecessor(text);

    console.log(`✅ Successfully extracted ${Object.keys(adminData).length} fields from predecessor`);

    return NextResponse.json({ adminData });
  } catch (error) {
    console.error('Error in extract-predecessor API:', error);
    return NextResponse.json(
      { error: 'Failed to extract predecessor data' },
      { status: 500 }
    );
  }
}
