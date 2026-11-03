"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/lib/../components/ui/Button";

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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised/40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-surface border border-border flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Evidence Copilot
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Grounded
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">Read-Only Evidence Reasoning</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Suggested Prompts if only 1 message */}
      {messages.length === 1 && (
        <div className="p-4 bg-background/50 border-b border-border/50">
          <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-2">
            Suggested Inquiries:
          </span>
          <div className="flex flex-col gap-1.5">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-left text-xs p-2 rounded-lg bg-surface hover:bg-surface-raised border border-border text-foreground/80 hover:text-foreground transition-colors font-mono"
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
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground mb-1">
              {msg.role === "user" ? (
                <>
                  <span>You</span>
                  <User className="h-3 w-3" />
                </>
              ) : (
                <>
                  <Bot className="h-3 w-3 text-emerald-400" />
                  <span>ReleaseLens Copilot</span>
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                msg.role === "user"
                  ? "bg-foreground text-background font-medium rounded-tr-sm"
                  : "bg-surface-raised border border-border text-foreground font-mono rounded-tl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground space-y-1">
                  <span className="font-semibold block uppercase">Cited Evidence Sources:</span>
                  {msg.citations.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Analyzing evidence telemetry...
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-3 border-t border-border bg-surface-raised/40">
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
            className="flex-1 px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
          />
          <Button type="submit" variant="primary" size="sm" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
