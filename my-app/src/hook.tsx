import { useContext, useRef, useEffect } from "react";
import OllamaContext from "./context";
import { Message } from "./types";

interface useOllamaProps {
    api: string;
    modelName: string;
    initialMessages: Message[];
}

const useOllama = ({ api, modelName, initialMessages }: useOllamaProps) => {
    const context = useContext(OllamaContext);
    if (context === undefined) {
        throw new Error("useOllama must be used within a OllamaProvider");
    }
    const hasInitialized = useRef(false);

    useEffect(() => {
        if(!hasInitialized.current && !context.ollama?.current){
            context.initialise(api, modelName, initialMessages);
            hasInitialized.current = true;
        }
    }, [api, context, initialMessages, modelName]);

    return context;
}

export default useOllama;