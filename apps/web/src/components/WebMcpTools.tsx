"use client";

import { useEffect } from "react";

type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
  };
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
};

type ModelContext = {
  registerTool: (tool: WebMcpTool) => Promise<unknown> | unknown;
  unregisterTool?: (name: string) => Promise<unknown> | unknown;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

const WORKSPACES = {
  studies: "/studies",
  biblicalTheology: "/biblical-theology",
  teaching: "/teaching",
  teachingMentor: "/teaching",
  sermonPreparation: "/preaching/preparation",
  framework: "/preaching/framework",
  exposition: "/preaching/exposition",
  finalDraft: "/preaching/final",
  delivery: "/preaching/delivery",
} as const;

function withStudyId(path: string, studyId?: string) {
  if (!studyId) return path;
  const params = new URLSearchParams({ studyId });
  return `${path}?${params.toString()}`;
}

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    const tools: WebMcpTool[] = [
      {
        name: "get_bsmp_browser_context",
        title: "Get BSMP browser context",
        description:
          "Return the current BSMP URL and the supported study-to-sermon workspace routes. This is read-only and does not expose database contents.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: () => ({
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          workspaces: WORKSPACES,
        }),
      },
      {
        name: "navigate_bsmp_workspace",
        title: "Navigate BSMP workspace",
        description:
          "Navigate the authenticated BSMP browser session to one of the supported study or sermon preparation workspaces. The existing BSMP authentication session remains responsible for access control.",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              enum: Object.keys(WORKSPACES),
              description: "The BSMP workspace to open.",
            },
            studyId: {
              type: "string",
              description: "Optional Study UUID used by study-scoped workspaces.",
            },
          },
          required: ["workspace"],
        },
        annotations: { readOnlyHint: false, consequentialHint: false },
        execute: ({ workspace, studyId }) => {
          if (typeof workspace !== "string" || !(workspace in WORKSPACES)) {
            throw new Error("Unsupported BSMP workspace.");
          }

          const path = WORKSPACES[workspace as keyof typeof WORKSPACES];
          window.location.assign(withStudyId(path, typeof studyId === "string" ? studyId : undefined));
          return `Navigating to ${path}`;
        },
      },
    ];

    for (const tool of tools) {
      void modelContext.registerTool(tool);
    }

    return () => {
      for (const tool of tools) {
        if (modelContext.unregisterTool) {
          void modelContext.unregisterTool(tool.name);
        }
      }
    };
  }, []);

  return null;
}
