import { createOllama } from "ollama-ai-provider";
import { generateText, streamText, tool } from "ai";
import { z } from 'zod';
import * as mathjs from 'mathjs';

const modelName = "qwen2.5:1.5b";

const ollama = createOllama({
  // optional settings, e.g.
  baseURL: "http://localhost:11434/api",
});

const model = ollama(modelName);

async function test() {
  const response = await fetch(
    "http://localhost:5678/webhook-test/1afa5dcb-89c8-4b4b-8f00-43e8eaf66632",
    {
      method: "POST",
      body: JSON.stringify({
        json: {
          chatInput: "Hello World",
        },
      }),
    }
  );
  const data = await response.json();
  console.log(data);
}

async function gen() {
  const result = await generateText({
    model: model,
    tools: {
      weather: tool({
        description: "Get the weather in a location",
        parameters: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
    },
    maxSteps: 5,
    prompt: "What is the weather in San Francisco?",
  });
  console.log(result);
}

async function tests() {
  console.time("process");
  const { text } = await generateText({
    model: model,
    prompt: "Write a recipe for biryani.",
  });
  console.timeLog("process", text);
  console.timeEnd("process");
}

async function testStream() {
  console.time("process");
  const { textStream } = streamText({
    model: model,
    prompt: "Write a recipe for paneer aaloo.",
  });
  for await (const textPart of textStream) {
    console.log(textPart);
  }
  console.timeEnd("process");
}

async function math() {
  const problem =
    "Calculate the profit for a day if revenue is $5000 and expenses are $3500.";

  const { text: answer } = await generateText({
    model: model,
    system:
      "You are solving math problems. Reason step by step. Use the calculator when necessary.",
    prompt: problem,
    tools: {
      calculate: tool({
        description:
          "A tool for evaluating mathematical expressions. Don't add currency symbols to expressions.",
        parameters: z.object({ expression: z.string() }),
        execute: async ({ expression }) =>
          mathjs.evaluate(expression.replaceAll("$", "")),
      }),
    },
    maxSteps: 5,
  });

  console.log(answer);
}
