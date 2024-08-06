import { NextResponse } from 'next/server'
import { OpenAI } from 'openai' 

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = 'helpful ai assistant'

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  }) 
  const data = await req.json() 

  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data],
    model: 'openai/gpt-3.5-turbo',
  })

  console.log(completion.choices[0].message.content)
  return NextResponse.json({message: 'Hello from server'})
}