import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an emergency response AI. You analyze a situation description and output a JSON response containing:
1. "priority": Exactly one of "Critical", "High", "Medium", or "Low".
2. "summary": A short, one-line summary of the emergency.
3. "requirements": A comma-separated list of specific tools or skills needed for rescue (e.g., "Ropes, First Aid, Boat, Life Jacket").

Respond ONLY with valid JSON.`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const aiResponseContent = completion.choices[0]?.message?.content;
    const parsedResponse = JSON.parse(aiResponseContent || '{}');

    return NextResponse.json({
      priority: parsedResponse.priority || 'High',
      summary: parsedResponse.summary || 'Emergency reported',
      requirements: parsedResponse.requirements || 'Standard Rescue Kit'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Groq AI Request Failed:', error.message);
    return NextResponse.json(
      {
        priority: 'High',
        summary: 'Emergency reported',
        requirements: 'First Aid Kit, Emergency Response'
      },
      { status: 200 }
    );
  }
}
