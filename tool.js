import { createOllama } from "ollama-ai-provider";
import { streamText } from "ai";
import { z } from "zod";

const modelName = "mistral";

const ollama = createOllama({
  // optional settings, e.g.
  baseURL: "http://localhost:11434/api",
});

const model = ollama(modelName,{
    simulateStreaming: true
  });

async function gen() {
  const result = streamText({
    model: model,
    toolCallStreaming: true,
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: "show the weather in a given city to the user",
        parameters: z.object({ city: z.string() }),
        execute: async ({}) => {
          const weatherOptions = ["sunny", "cloudy", "rainy", "snowy", "windy"];
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: "Ask the user for confirmation.",
        parameters: z.object({
          message: z.string().describe("The message to ask for confirmation."),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          "Get the user location. Always ask for confirmation before using this tool.",
        parameters: z.object({}),
      },
    },
    maxSteps: 5,
    prompt: "What is the weather in San Francisco?",
  });
  for await (const textPart of result.textStream) {
    console.log(textPart);
  }
}

gen();
