import {
  cosineSimilarity,
  embed,
  generateObject,
  generateText,
  wrapLanguageModel,
  embedMany,
  streamText
} from "ai";
//import { z } from "zod";
import { createOllama } from 'ollama-ai-provider';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chroma } from "@langchain/community/vectorstores/chroma"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";

const ollama = createOllama({
    // optional settings, e.g.
    baseURL: 'http://localhost:11434/api',
});

// schema for validating the custom provider metadata
// const selectionSchema = z.object({
//   files: z.object({
//     selection: z.array(z.string()),
//   }),
// });

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
      model: ollama("mistral", { structuredOutputs: true }),
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
      model: ollama("mistral", { structuredOutputs: true }),
      system: "Answer the users question:",
      prompt: lastUserMessageContent,
    });

    // Embed the hypothetical answer
    const { embedding: hypotheticalAnswerEmbedding } = await embed({
      model: ollama.embedding("mistral"),
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

async function getPdfContent(url) {
    // const response = await fetch(url);
    // const arrayBuffer = await response.arrayBuffer();
    // const buffer = Buffer.from(arrayBuffer);
    // const blob = new Blob([buffer], { type: "application/pdf" });
    const loader = new PDFLoader(url); 
    const content = await loader.load();
    return content;
}

const filename = "DOC-20241003-WA0008..pdf";

async function pdfEmbed(url) {
    const content = await getPdfContent(url);
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    const chunkedContent = await textSplitter.splitDocuments(content);
    
    const { embeddings } = await embedMany({
        model: ollama.embedding("mistral"),
        values: chunkedContent.map((chunk) => chunk.pageContent),
    });
  
    storage = chunkedContent.map((chunk, i) => ({
      id: `${filename}/${i}`,
      filePath: `${filename}`,
      content: chunk.pageContent,
      embedding: embeddings[i],
    }))
}

const customModel = wrapLanguageModel({
    model: ollama("mistral"),
    middleware: ragMiddleware,
});

async function main() {
  console.time("process");
  await pdfEmbed(`./${filename}`);
  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Is utkarsh kumar eligible for Data analytics role?",
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

main();