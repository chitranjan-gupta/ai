async function test(){
    const response = await fetch('http://localhost:5678/webhook-test/1afa5dcb-89c8-4b4b-8f00-43e8eaf66632', {
        method: "POST",
        body: JSON.stringify({
            json:{
                chatInput: 'Hello World'
            }
        }),
    });
    const data = await response.json();
    console.log(data);
}
import { createOllama } from 'ollama-ai-provider';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';
const ollama = createOllama({
    // optional settings, e.g.
    baseURL: 'http://localhost:11434/api',
  });
  
const model = ollama('mistral');

async function gen() {  
  const result = await generateText({
    model: model,
    tools: {
      weather: tool({
        description: 'Get the weather in a location',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
    },
    maxSteps: 5,
    prompt: 'What is the weather in San Francisco?',
  });
  console.log(result);
}
void gen();