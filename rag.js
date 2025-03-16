import {
  cosineSimilarity,
  embed,
  generateObject,
  generateText,
  wrapLanguageModel,
  embedMany,
  streamText
} from "ai";
import { createOllama } from 'ollama-ai-provider';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { z } from "zod";
//import { Chroma } from "@langchain/community/vectorstores/chroma"
//import { OllamaEmbeddings } from "@langchain/ollama";

// schema for validating the custom provider metadata
// const selectionSchema = z.object({
//   files: z.object({
//     selection: z.array(z.string()),
//   }),
// });

// const modelNames = {
//   "qwen2.5:1.5b": true,
//   "llama3.2:3b": true,
//   "mistral:7b": true
// }

const modelName = "mistral"
const filename = "DOC-20241003-WA0008..pdf";
const question = "Who is Utkarsh Kumar and from where he is doing B.Tech and is he eligible for Backend Developer?";

const ollama = createOllama({
    // optional settings, e.g.
    baseURL: 'http://localhost:11434/api',
});

let storage = [];

const ragMiddleware = {
  transformParams: async ({ params }) => {

    const { prompt: messages, 
      //providerMetadata 
    } = params;

    // validate the provider metadata with Zod:
    //const { success, data } = selectionSchema.safeParse(providerMetadata);

    //if (!success) return params; // no files selected

    //const selection = data.files.selection;

    const recentMessage = messages.pop();

    if (!recentMessage || recentMessage.role !== "user") {
      if (recentMessage) {
        messages.push(recentMessage);
      }

      return params;
    }

    const lastUserMessageContent = recentMessage.content
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .join("\n");

    // Classify the user prompt as whether it requires more context or not
    const { object: classification } = await generateObject({
      // fast model for classification:
      model: ollama(modelName, { structuredOutputs: true }),
      output: "enum",
      enum: ["question", "statement", "other"],
      system: "classify the user message as a question, statement, or other",
      prompt: lastUserMessageContent,
    });

    // only use RAG for questions
    if (classification !== "question") {
      messages.push(recentMessage);
      return params;
    }

    // Use hypothetical document embeddings:
    const { text: hypotheticalAnswer } = await generateText({
      // fast model for generating hypothetical answer:
      model: ollama(modelName, { structuredOutputs: true }),
      system: "Answer the users question:",
      prompt: lastUserMessageContent,
    });

    // Embed the hypothetical answer
    const { embedding: hypotheticalAnswerEmbedding } = await embed({
      model: ollama.embedding(modelName),
      value: hypotheticalAnswer,
    });

    // find relevant chunks based on the selection
    //const chunksBySelection = await getChunksByFilePaths({
    //  filePaths: selection.map((path) => `${session.user?.email}/${path}`),
    //});

    //replace chunksBySelection with storage
    const chunksWithSimilarity = storage.map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(
        hypotheticalAnswerEmbedding,
        chunk.embedding,
      ),
    }));

    // rank the chunks by similarity and take the top K
    chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    const k = 10;
    const topKChunks = chunksWithSimilarity.slice(0, k);

    // add the chunks to the last user message
    messages.push({
      role: "user",
      content: [
        ...recentMessage.content,
        {
          type: "text",
          text: "Here is some relevant information that you can use to answer the question:",
        },
        ...topKChunks.map((chunk) => ({
          type: "text",
          text: chunk.content,
        })),
      ],
    });

    return { ...params, prompt: messages };
  },
};

export async function getPdfContent(url, buffer, options) {
    console.log("buffer", buffer);
    if(!url && !buffer){
      return;
    }
    let loader = null;
    console.log("loader", loader);
    if(url && !options){
      options.local = true;
    }
    if(url && options && options.remote === true){
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    if(buffer){
      const blob = new Blob([buffer], { type: "application/pdf" });
      console.log(blob)
      loader = new PDFLoader(blob);
    } else if(url && options && options.local === true) {
      loader = new PDFLoader(url);
    }
    const content = await loader.load();
    return content;
}

async function getWebContent(url) {
  
}

export async function pdfEmbed(content) {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    const chunkedContent = await textSplitter.splitDocuments(content);
    
    const { embeddings } = await embedMany({
        model: ollama.embedding(modelName),
        values: chunkedContent.map((chunk) => chunk.pageContent),
    });
  
    storage = chunkedContent.map((chunk, i) => ({
      id: `${filename}/${i}`,
      filePath: `${filename}`,
      content: chunk.pageContent,
      embedding: embeddings[i],
    }))
}

const model = ollama(modelName,{
  simulateStreaming: true
});

const customModel = wrapLanguageModel({
    model: model,
    middleware: ragMiddleware,
});

export function plain(messages){
  const result = streamText({
    model: model,
    messages,
  });
  return result
}

export function withTool(messages){
  const result = streamText({
    model: model,
    messages,
    toolCallStreaming: true,
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        parameters: z.object({ city: z.string() }),
        execute: async ({}) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: 'Ask the user for confirmation.',
        parameters: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          'Get the user location. Always ask for confirmation before using this tool.',
        parameters: z.object({}),
      },
    },
    maxSteps: 5,
  });
  return result
}

export function main(messages) {
  const result = streamText({
      model: customModel,
      system:
        "you are a friendly assistant! keep your responses concise and helpful.",
      messages,
      providerOptions: {
        files: {
          selection: [],
        },
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: "stream-text",
      },
  });
  return result
}

async function test() {
  console.time("process");
  const content = await getPdfContent(`./${filename}`);
  await pdfEmbed(content);
  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: question,
        },
      ],
    },
  ];
  const { textStream } = streamText({
      model: customModel,
      system:
        "you are a friendly assistant! keep your responses concise and helpful.",
      messages,
      providerOptions: {
        files: {
          selection: [],
        },
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: "stream-text",
      },
  });
  for await (const message of textStream) {
    console.log(message);
  }
  console.timeEnd("process");
}