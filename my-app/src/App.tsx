import './App.css'
import useOllama from './hook'
import Tesseract from 'tesseract.js';
// import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";
// import { Document, VectorStoreIndex, Settings, storageContextFromDefaults, SimpleDocumentStore, SimpleIndexStore, SimpleVectorStore } from "llamaindex";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

// async function test() {
//   const ollama = new Ollama({ model: "llama3.2" });
//   const ollamaEmbedding = new OllamaEmbedding({ model: "llama3.2" });

//   // Use Ollama LLM and Embed Model
//   Settings.llm = ollama;
//   Settings.embedModel = ollamaEmbedding;

//   const documentDict = localStorage.getItem("documentDict");
//   const indexDict = localStorage.getItem("indexDict");
//   const vectorDict = localStorage.getItem("vectorDict");

//   const simpleDocumentStore = documentDict ? SimpleDocumentStore.fromDict(JSON.parse(documentDict)) : new SimpleDocumentStore();
//   const simpleIndexStore = indexDict ? SimpleIndexStore.fromDict(JSON.parse(indexDict)) : new SimpleIndexStore();
//   const simpleVectorStore = vectorDict ? SimpleVectorStore.fromDict(JSON.parse(vectorDict)) : new SimpleVectorStore();

//   const storageContext = await storageContextFromDefaults({
//     docStore: simpleDocumentStore,
//     vectorStore: simpleVectorStore,
//     indexStore: simpleIndexStore
//   });

//   // Load and index documents
//   const index = await VectorStoreIndex.fromDocuments([], {
//     storageContext
//   });

//   // get retriever
//   const retriever = index.asRetriever();

//   // Create a query engine
//   const queryEngine = index.asQueryEngine({
//     retriever,
//   });

//   const query = "Who is Bini Pandey and from where he is doing BCA and is he eligible for Backend Developer?";

//   // Query
//   const response = await queryEngine.query({
//     query,
//   });

//   // Log the response
//   console.log(response.message);
// }

// async function saveContext(text: string){
//   const ollama = new Ollama({ model: "llama3.2" });
//   const ollamaEmbedding = new OllamaEmbedding({ model: "llama3.2" });

//   // Use Ollama LLM and Embed Model
//   Settings.llm = ollama;
//   Settings.embedModel = ollamaEmbedding;

//   const document = new Document({ text: text, id_: "essay" });

//   const documentDict = localStorage.getItem("documentDict");
//   const indexDict = localStorage.getItem("indexDict");
//   const vectorDict = localStorage.getItem("vectorDict");

//   const simpleDocumentStore = documentDict ? SimpleDocumentStore.fromDict(JSON.parse(documentDict)) : new SimpleDocumentStore();
//   const simpleIndexStore = indexDict ? SimpleIndexStore.fromDict(JSON.parse(indexDict)) : new SimpleIndexStore();
//   const simpleVectorStore = vectorDict ? SimpleVectorStore.fromDict(JSON.parse(vectorDict)) : new SimpleVectorStore();

//   const storageContext = await storageContextFromDefaults({
//     docStore: simpleDocumentStore,
//     vectorStore: simpleVectorStore,
//     indexStore: simpleIndexStore
//   })

//   // Load and index documents
//   await VectorStoreIndex.fromDocuments([document], {
//     storageContext
//   });

//   localStorage.setItem("documentDict", JSON.stringify(simpleDocumentStore.toDict()));
//   localStorage.setItem("indexDict", JSON.stringify(simpleIndexStore.toDict()));
//   localStorage.setItem("vectorDict", JSON.stringify(simpleVectorStore.toDict()));

// }

function App() {
  const { messages, stop, reload, loading, error, input, handleInputChange, handleSubmit, addContext } = useOllama({
    api: 'http://localhost:11434',
    modelName: 'llama3.2',
    initialMessages: []
  });
  return (
    <>
      <input type='file' onChange={async (event) => {
        const files = event.target.files;
        if (files instanceof FileList) {
          const file = files.length > 0 ? files[0] : null;
          if (file) {
            if (file.type.includes("image")) {
              const text = await Tesseract.recognize(
                file,
                'eng',
                {
                  logger: m => {
                    if (m.status === 'recognizing text') {
                      console.log("progress", m.progress)
                    }
                  }
                }
              ).then(({ data: { text } }) => text);
              console.log(text);
            } else if (file.type.includes("text")) {
              const fileReader = new FileReader();
              fileReader.onload = () => {
                const pdfData = fileReader.result;
                if (pdfData) {
                  const pdfDoc = pdfjsLib.getDocument({ data: pdfData });
                  pdfDoc.promise.then((doc) => {
                    const numPages = doc.numPages;
                    let pdfText = '';

                    for (let i = 1; i <= numPages; i++) {
                      doc.getPage(i).then((page) => {
                        page.getTextContent().then((textContent) => {
                          const pageText = textContent.items.map((item) => (item as unknown as { str: string }).str).join('');
                          pdfText += pageText + '\n';
                          if (i === numPages) {
                            addContext(file.name, pdfText);
                          }
                        });
                      });
                    }
                  })
                }
              }
              fileReader.readAsArrayBuffer(file);
            } else {
              const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
              let allText = '';

              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context!, viewport }).promise;
                const text = await Tesseract.recognize(
                  canvas,
                  'eng',
                  {
                    logger: m => {
                      if (m.status === 'recognizing text') {
                        console.log((pageNum - 1) / pdf.numPages + m.progress / pdf.numPages);
                      }
                    }
                  }
                ).then(({ data: { text } }) => text);

                allText += text + '\n\n';
              }
              addContext(file.name, allText);
            }
          }
        }
      }} />
      <div className='flex flex-col gap-2'>
        {messages.map((message, index) => (
          <div key={index} className={`${message.role === 'user' ? 'self-end' : 'self-start'}`}>
            {message.content}
          </div>
        ))}
      </div>
      {error && <div className='text-red-500'>{error.message}</div>}
      {loading && <div>Loading...</div>}
      <button onClick={stop}>Stop</button>
      <button onClick={reload}>Reload</button>
      <br />
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Enter your prompt for the AI"
          disabled={error != null}
        />
        <button type='submit'>Send</button>
      </form>
    </>
  )
}

export default App
