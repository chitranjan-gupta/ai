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
const ollama = createOllama({
    // optional settings, e.g.
    baseURL: 'http://localhost:11434/api',
  });
  
const model = ollama('llama3.2');

async function testStream(){
  console.time('process')
  const { textStream } = streamText({
    model: model,
    prompt: 'Hugging Face is',
  });
  for await (const textPart of textStream) {
    console.log(textPart);
  }
  console.timeEnd('process')
}

void testStream();