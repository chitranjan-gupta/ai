import { Ollama } from 'ollama/browser'
import OpenAI from 'openai';
import { useState, useRef, useCallback, type ReactNode, type ChangeEvent, type FormEvent } from "react";
import OllamaContext from './context';
import type { Message } from './types';

const OllamaProvider = ({ children }: { children: ReactNode }) => {
    const ollama = useRef<Ollama | null>(null);
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
                const response = ollama.current?.chat({ model: modelName, messages: currentmessages, stream: true });
                if (response) {
                    for await (const part of await response) {
                        if (part.done === false) {
                            assembledMessage.content += part.message.content;
                            setMessages([...currentmessages, assembledMessage]);
                        }
                    }
                }
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
            ollama.current.abort();
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
    const initialise = useCallback((host: string, modelName: string, initialMessages: Message[]) => {
        ollama.current = new Ollama({ host: host });
        //openai.current = new OpenAI({ apiKey: "" });
        setModelName(modelName);
        setMessages(initialMessages);
    }, [setModelName, setMessages]);
    return (
        <OllamaContext.Provider value={{ ollama, initialise, sendMessage, messages, setMessages, loading, error, stop, reload, input, handleInputChange, handleSubmit }}>
            {children}
        </OllamaContext.Provider>
    );
}

export default OllamaProvider;