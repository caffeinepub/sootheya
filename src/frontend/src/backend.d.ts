import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: bigint;
    content: string;
    role: string;
    timestamp: bigint;
    sessionId: string;
}
export interface backendInterface {
    clearChat(sessionId: string): Promise<boolean>;
    getAllProfiles(): Promise<Array<Message>>;
    getAllProfilesByEmail(): Promise<Array<Message>>;
    getChatHistory(sessionId: string): Promise<Array<Message>>;
    isRegistered(): Promise<boolean>;
    sendMessage(sessionId: string, userMessage: string): Promise<string>;
}
