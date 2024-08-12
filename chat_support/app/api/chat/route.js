import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';


const indexName = 'chatbot';

const systemPrompt = `
You are a mental health assistant. Your role is to act as a virtual therapist.
Provide supportive, empathetic, and professional responses.
Help users manage their mental health issues by offering advice and support.
If you do not have enough information to answer a question, ask the user for more details.
`;

export async function POST(req) {
  try {
    const pinecone = new Pinecone({apiKey: '95d7c854-743b-4eca-8065-6943edcc6c04'});
    const indexName = 'chatbot';
    const indexExists = await pinecone.index(indexName);

    if (!indexExists) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 768, // Adjust dimension based on your model
      });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const data = await req.json();
    const userQuery = data.find(message => message.role === 'user')?.content;


    // Generate embedding for the user query
    const embeddingResponse = await fetch('http://localhost:5000/generate_embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: [userQuery] }),
    });

    const parsedResponse = await embeddingResponse.json();
    const queryEmbedding = parsedResponse.embeddings[0];


    // Query Pinecone index
    const pineconeIndex = pinecone.Index(indexName);
    const results = await pineconeIndex.query({
      top_k: 5,
      queries: [queryEmbedding],
    });

    // Prepare the context for OpenAI
    const retrievedDocs = results.matches.map(match => match.metadata.text).join('\n');

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...data,
        { role: 'user', content: `Relevant documents: ${retrievedDocs}` },
      ],
      model: 'gpt-3.5-turbo',
      stream: true,
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
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error handling request:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}