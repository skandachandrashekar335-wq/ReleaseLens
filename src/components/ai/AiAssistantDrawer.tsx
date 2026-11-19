"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AiAssistantDrawerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  auditContext?: {
    rqi?: any;
    checks?: any[];
    bugs?: any[];
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  timestamp: string;
}

export function AiAssistantDrawer({ projectId, isOpen, onClose, auditContext }: AiAssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m_welcome",
      role: "assistant",
      content:
        "Hello! I am your read-only ReleaseLens Quality Assistant. I answer technical questions grounded strictly in captured audit evidence, checks, and logged defects without hallucination. How can I help you diagnose this release?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestedPrompts = [
    "Summarize the release blockers and hard gate failures.",
    "Which security headers are missing and how do I fix them?",
    "Give me step-by-step reproduction instructions for all critical bugs.",
    "Draft a release readiness summary for our engineering lead.",
  ];

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPrompt) setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt: textToSend,
          context: auditContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Assistant response failed");
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: data.reply || "No response received.",
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content:
            "I could not complete the query due to a network or model timeout. The technical evidence remains available for inspection in the dashboard tabs.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0a0a0a] border-l border-border shadow-2xl flex flex-col font-mono">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-[#0d0d0d]">
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-none border border-primary/50 bg-black flex items-center justify-center text-primary [box-shadow:inset_0_0_8px_rgba(235,184,0,0.3)]">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
              Evidence Copilot
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20">
                Grounded
              </span>
            </h3>
            <p className="text-[10px] text-foreground/40 font-mono">Read-Only Evidence Reasoning</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-foreground/40 hover:text-foreground hover:bg-black transition-colors border border-transparent hover:border-border cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Suggested Prompts if only 1 message */}
      {messages.length === 1 && (
        <div className="p-4 bg-black border-b border-border space-y-2">
          <span className="text-[10px] uppercase text-primary tracking-wider block">
            Suggested Inquiries:
          </span>
          <div className="flex flex-col gap-1.5">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-left text-xs p-2.5 bg-[#0d0d0d] hover:bg-[#141414] border border-border hover:border-primary/40 text-foreground/80 hover:text-foreground transition-colors font-mono cursor-pointer"
              >
                &ldquo;{p}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/40 mb-1">
              {msg.role === "user" ? (
                <>
                  <span>You</span>
                  <User className="size-3" />
                </>
              ) : (
                <>
                  <Bot className="size-3 text-primary" />
                  <span>ReleaseLens Copilot</span>
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            <div
              className={`p-3.5 text-xs leading-relaxed max-w-[90%] ${
                msg.role === "user"
                  ? "bg-black border border-primary text-foreground font-sans font-medium"
                  : "bg-[#0d0d0d] border border-border text-foreground font-mono"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border text-[10px] text-foreground/50 space-y-1">
                  <span className="font-semibold block uppercase text-primary">Cited Evidence Sources:</span>
                  {msg.citations.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-primary" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-primary">
            <span className="inline-block size-2 rounded-full bg-primary animate-ping" />
            Analyzing evidence telemetry...
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-3 border-t border-border bg-[#0d0d0d]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about TLS, missing headers, or bug fixes..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-xs bg-black border border-border text-foreground font-mono placeholder:text-foreground/30 focus:outline-none focus:border-primary/50"
          />
          <Button
            type="submit"
            variant="chamfer"
            size="sm"
            disabled={isLoading || !inputValue.trim()}
            className="h-9 px-3.5"
          >
            <Send className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}