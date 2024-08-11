import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import pinecone from './pineconeClient';

const indexName = 'chatbot';

const systemPrompt = `
You are a mental health assistant. Your role is to act as a virtual therapist.
Provide supportive, empathetic, and professional responses.
Help users manage their mental health issues by offering advice and support.
If you do not have enough information to answer a question, ask the user for more details.
`;

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const data = await req.json();

  const userQuery = data.find(message => message.role === 'user')?.content;

  // Generate embedding for the user query
  const response = await fetch('http://localhost:5000/generate_embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: [userQuery] })
  }).then(res => res.json());

  const queryEmbedding = response.embeddings[0];

  // Query Pinecone index
  const pineconeIndex = pinecone.Index(indexName);
  const results = await pineconeIndex.query({
    top_k: 5,
    queries: [queryEmbedding]
  });

  // Prepare for OpenAI
  const retrievedDocs = results.matches.map(match => match.metadata.text).join('\n')

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...data,
        { role: 'user', content: `Relevant documents: ${retrievedDocuments}` },
      ],
      model: 'gpt-3.5-turbo',
      stream: true
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream);
  } catch (err) {
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
