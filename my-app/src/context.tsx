import { createContext, type ChangeEvent, type FormEvent, type RefObject } from "react";
import type { Message } from './types';
//import { Ollama } from "ollama/browser";
import { Ollama } from "@llamaindex/ollama";

interface OllamaContextProps {
    ollama: RefObject<Ollama | null> | null;
    initialise: (host: string, modelName: string, initialMessages: Message[]) => Promise<void>;
    sendMessage: (content: string) => void;
    messages: Message[];
    setMessages: (message: Message[]) => void;
    loading: boolean;
    error: Error | null;
    stop: () => void;
    reload:  () => void;
    input: string;
    handleInputChange: (input: ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent) => void;
    addContext: (id: string, text: string) => Promise<void>;
}

const OllamaContext = createContext<OllamaContextProps>({
    ollama: null,
    initialise: async (host: string, modelName: string, initialMessages: Message[]) => { console.log(host, modelName, initialMessages) },
    sendMessage: (content: string) => { console.log(content) },
    messages: [],
    setMessages: (messages: Message[]) => { console.log(messages) },
    loading: false,
    error: null,
    stop: () => { },
    reload: () => { },
    input: "",
    handleInputChange: (input: ChangeEvent<HTMLTextAreaElement>) => { console.log(input) },
    handleSubmit: (e: FormEvent) => { console.log(e) },
    addContext: async (id: string, text: string) => { console.log(id, text) }
});

export default OllamaContext;