// import { Ollama } from 'ollama/browser'
import OpenAI from 'openai';
import { useState, useRef, useCallback, type ReactNode, type ChangeEvent, type FormEvent } from "react";
import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";
import { Document, VectorStoreIndex, Settings, storageContextFromDefaults, SimpleDocumentStore, SimpleIndexStore, SimpleVectorStore, StorageContext, BaseChatEngine, ChatMessage } from "llamaindex";
import OllamaContext from './context';
import type { Message } from './types';

const OllamaProvider = ({ children }: { children: ReactNode }) => {
    const ollama = useRef<Ollama | null>(null);
    const ollamaEmbedding = useRef<OllamaEmbedding | null>(null);
    const simpleDocumentStore = useRef<SimpleDocumentStore | null>(null);
    const simpleIndexStore = useRef<SimpleIndexStore | null>(null);
    const simpleVectorStore = useRef<SimpleVectorStore | null>(null);
    const storageContext = useRef<StorageContext | null>(null);
    const vectorIndex = useRef<VectorStoreIndex | null>(null);
    const chatEngine = useRef<BaseChatEngine | null>(null);
    const openai = useRef<OpenAI | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setloading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [input, setInput] = useState<string>('');
    const [modelName, setModelName] = useState<string>('llama3.2');
    const sendMessage = useCallback(async (content: string) => {
        try {
            setloading(true);
            setError(null);
            const message = { id: Date.now().toString(), role: 'user', content };
            const currentmessages = [...messages, message];
            setMessages(currentmessages);
            const assembledMessage = { id: Date.now().toString(), role: 'assistant', content: '' };
            if (ollama.current) {
                const response = ollama.current?.chat({ messages: currentmessages as ChatMessage[], stream: true })
                if (response) {
                    for await (const part of await response) {
                        assembledMessage.content += part.delta;
                        setMessages([...currentmessages, assembledMessage]);
                    }
                }
                // const response = ollama.current?.chat({ model: modelName, messages: currentmessages, stream: true });
                // if (response) {
                //     for await (const part of await response) {
                //         if (part.done === false) {
                //             assembledMessage.content += part.message.content;
                //             setMessages([...currentmessages, assembledMessage]);
                //         }
                //     }
                // }
            } else if (openai.current) {
                const response = openai.current.chat.completions.create({
                    model: modelName,
                    messages: currentmessages as unknown[] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
                    stream: true
                })
                if (response) {
                    for await (const part of await response) {
                        assembledMessage.content += part.choices[0]?.delta.content;
                        setMessages([...currentmessages, assembledMessage]);
                    }
                }
            } else if (vectorIndex.current) {
                const response = chatEngine.current?.chat({ message: content, stream: true });
                if (response) {
                    for await (const part of await response) {
                        assembledMessage.content += part.message.content;
                        setMessages([...currentmessages, assembledMessage]);
                    }
                }
            }
        } catch (e: unknown) {
            setError(typeof e === "string" ? new Error(e) : e as Error);
            console.log(e);
        } finally {
            setloading(false);
        }
    }, [messages, setMessages, modelName]);
    const stop = useCallback(() => {
        if (ollama.current) {
            ollama.current?.ollama.abort();
        }
    }, []);
    const reload = useCallback(() => {
        if (ollama.current) {
            sendMessage(messages[messages.length - 1].content);
        }
    }, [messages, sendMessage]);
    const handleInputChange = useCallback((input: ChangeEvent<HTMLTextAreaElement>) => {
        setInput(input.target.value);
    }, [setInput]);
    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        sendMessage(input);
        setInput('');
    }, [input, sendMessage]);
    const addContext = useCallback(async (id: string, text: string) => {
        const document = new Document({ text: text, id_: id });
        if (vectorIndex.current) {
            await vectorIndex.current.insert(document);
            localStorage.setItem("documentDict", JSON.stringify(simpleDocumentStore.current?.toDict()));
            localStorage.setItem("indexDict", JSON.stringify(simpleIndexStore.current?.toDict()));
            localStorage.setItem("vectorDict", JSON.stringify(simpleVectorStore.current?.toDict()));
        }
    }, [])

    const initialise = useCallback(async (host: string, modelName: string, initialMessages: Message[]) => {
        openai.current = new OpenAI({ apiKey: "", dangerouslyAllowBrowser: true });
        ollama.current = new Ollama({ model: modelName, config: { host: host } });
        ollamaEmbedding.current = new OllamaEmbedding({ model: modelName });
        Settings.llm = ollama.current;
        Settings.embedModel = ollamaEmbedding.current;
        const documentDict = localStorage.getItem("documentDict");
        const indexDict = localStorage.getItem("indexDict");
        const vectorDict = localStorage.getItem("vectorDict");
        simpleDocumentStore.current = documentDict ? SimpleDocumentStore.fromDict(JSON.parse(documentDict)) : new SimpleDocumentStore();
        simpleIndexStore.current = indexDict ? SimpleIndexStore.fromDict(JSON.parse(indexDict)) : new SimpleIndexStore();
        simpleVectorStore.current = vectorDict ? SimpleVectorStore.fromDict(JSON.parse(vectorDict)) : new SimpleVectorStore();
        storageContext.current = await storageContextFromDefaults({
            docStore: simpleDocumentStore.current,
            vectorStore: simpleVectorStore.current,
            indexStore: simpleIndexStore.current
        });
        // Load and index documents
        vectorIndex.current = await VectorStoreIndex.fromDocuments([], {
            storageContext: storageContext.current
        });
        chatEngine.current = vectorIndex.current.asChatEngine({ systemPrompt: "You are a helpful assistant.", chatHistory: initialMessages as ChatMessage[] });
        setModelName(modelName);
        setMessages(initialMessages);
    }, [setModelName, setMessages]);
    return (
        <OllamaContext.Provider value={{ ollama, initialise, sendMessage, messages, setMessages, loading, error, stop, reload, input, handleInputChange, handleSubmit, addContext }}>
            {children}
        </OllamaContext.Provider>
    );
}

export default OllamaProvider;