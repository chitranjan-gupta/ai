import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";
import { Document, VectorStoreIndex, Settings, storageContextFromDefaults } from "llamaindex";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs/promises";
 
const ollama = new Ollama({ model: "llama3.2", temperature: 0.75 });
const ollamaEmbedding = new OllamaEmbedding({ model: "llama3.2" });
 
// Use Ollama LLM and Embed Model
Settings.llm = ollama;
Settings.embedModel = ollamaEmbedding;
 
async function main() {
  //const essay = await fs.readFile("./test.txt", "utf-8");
  const loader = new PDFLoader("./DOC-20241003-WA0008..pdf");
  const essay = await loader.load();

  const document = new Document({ text: essay[0].pageContent, id_: "essay" });
  //const document = new Document({ text: essay, id_: "essay"});

  const storageContext = await storageContextFromDefaults({
      persistDir: "./storage",
  });

  // Load and index documents
  const index = await VectorStoreIndex.fromDocuments([document], {
    storageContext
  });
 
  // get retriever
  //const retriever = index.asRetriever();
 
  // Create a query engine
  //const queryEngine = index.asQueryEngine({
  //  retriever,
  //});
 
  //const query = "Who is Utkarsh?";
 
  // Query
  //const response = await queryEngine.query({
  //  query,
  //});
 
  // Log the response
  //console.log(response.message);
}

async function load(){
  const storageContext = await storageContextFromDefaults({
    persistDir: "./storage",
  });
  
  const index = await VectorStoreIndex.fromDocuments([], {
    storageContext,
  });
  
  // get retriever
  const retriever = index.asRetriever();

  // Create a query engine
  const queryEngine = index.asQueryEngine({
    retriever,
  });
 
  const query = "Who is Utkarsh and from Where he is doing his B.Tech and what is his email?";
 
  // Query
  const response = await queryEngine.query({
    query,
  });
 
  // Log the response
  console.log(response.message);
}

load();