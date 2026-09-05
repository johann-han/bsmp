"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@repo/ui";
import type { StudySession } from "@bsmp/study";
import { StudyId } from "@bsmp/study";
import type { Database } from "../../lib/database.types";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { supabase } from "../../lib/supabase";
import { findTeachingPlans, saveTeachingPlan } from "../../lib/teachingPlanRepository";

type BiblicalTheologyEntry = Database["public"]["Tables"]["biblical_theology_entries"]["Row"];
type MentorFocus = "centralTruth" | "teachingAim" | "keyPoints" | "explanation" | "discussionQuestions" | "responsePrompt";

const linkStyle = { color: "#1d4ed8", textDecoration: "none" } as const;

function lines(value: string): string[] {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function joinLines(value: readonly string[]): string {
    return value.join("\n");
}

function toggleId(values: string[], id: string): string[] {
    return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}
