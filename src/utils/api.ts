import type { Message } from "@/components/chat/chat-window"

const BASE = import.meta.env.VITE_API_CRUD_URL

export type AgentNamesResponse = {
  melchior?: string
  balthasar?: string
  casper?: string
  updatedAt?: string
}

export const api = {
  presets: {
    list: (userId: string) =>
      fetch(`${BASE}presets`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json()),
    save: (body: any) =>
      fetch(`${BASE}presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((res) => res.json()),
    status: (userId: string) =>
      fetch(`${BASE}presets/status?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json()),
    delete: (userId: string, id: string) =>
      fetch(`${BASE}presets`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, presetId: id }),
      }).then((res) => res.json()),
  },
  chats: {
    list: (userId: string) =>
      fetch(`${BASE}chats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json()),
    save: (body: { userId: string; chatId?: string; title: string; messages: Message[]; presetUsed?: string }) =>
      fetch(`${BASE}chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((res) => res.json()),
  },
  agentNames: {
    get: (userId: string): Promise<AgentNamesResponse> =>
      fetch(`${BASE}agent-names?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json()),
    save: (body: { userId: string; agentKey: "melchior" | "balthasar" | "casper"; name: string }) =>
      fetch(`${BASE}agent-names`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((res) => res.json()),
  },
}
