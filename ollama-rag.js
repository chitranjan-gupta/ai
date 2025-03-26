import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { z } from "zod";
import ollama from "ollama";

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

export async function embedMany({ model, values }){
    const o = ollama.embed({ model: model, input: values });
    return o
}

const modelName = "mistral"
const filename = "DOC-20241003-WA0008..pdf";
const question = "Who is Utkarsh Kumar and from where he is doing B.Tech and is he eligible for Backend Developer?";
let storage = [];

export async function pdfEmbed(content) {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    const chunkedContent = await textSplitter.splitDocuments(content);
    
    const { embeddings } = await embedMany({
        model: modelName,
        values: chunkedContent.map((chunk) => chunk.pageContent),
    });
  
    storage = chunkedContent.map((chunk, i) => ({
      id: `${filename}/${i}`,
      filePath: `${filename}`,
      content: chunk.pageContent,
      embedding: embeddings[i],
    }))
}

