"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { SermonDeliverySectionNavigation } from "./SermonDeliverySectionNavigation";

interface Props { studyId: string; }

type ReadingSize = "compact" | "comfortable" | "large";
