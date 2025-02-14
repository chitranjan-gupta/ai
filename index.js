import { createOllama } from 'ollama-ai-provider';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';
import * as mathjs from 'mathjs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

var corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors(corsOptions));

const ollama = createOllama({
  // optional settings, e.g.
  baseURL: 'http://localhost:11434/api',
});

const model = ollama('llama3.2');

async function test(){
    console.time('process')
    const { text } = await generateText({
        model: model,
        prompt: 'Write a recipe for biryani.',
    });
    console.timeLog("process", text);
    console.timeEnd('process')
}

async function testStream(){
  console.time('process')
  const { textStream } = streamText({
    model: model,
    prompt: 'Write a recipe for paneer aaloo.',
  });
  for await (const textPart of textStream) {
    console.log(textPart);
  }
  console.timeEnd('process')
}

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

async function math() {
  const problem =
  'Calculate the profit for a day if revenue is $5000 and expenses are $3500.';

  const { text: answer } = await generateText({
    model: model,
    system:
      "You are solving math problems. Reason step by step. Use the calculator when necessary.",
    prompt: problem,
    tools: {
      calculate: tool({
        description: "A tool for evaluating mathematical expressions. Don't add currency symbols to expressions.",
        parameters: z.object({ expression: z.string() }),
        execute: async ({ expression }) => mathjs.evaluate(expression.replaceAll('$', '')),
      }),
    },
    maxSteps: 5,
  });

  console.log(answer);
}

app.post('/api/chat', async (req, res) => { 
  try {
    const messages = await req.body.messages;
    const result = streamText({
      model: model,
      messages,
    });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200);
    for await (const textPart of result.textStream) {
      res.write(textPart);
    }
    res.end();
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000 ');
});
