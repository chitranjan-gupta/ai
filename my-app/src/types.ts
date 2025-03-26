import type { Message as MessageType } from 'ollama/browser'

export interface Message extends MessageType {
    id: string;
}