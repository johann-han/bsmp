$ErrorActionPreference = "Stop"

# Run from C:\Users\johan\bsmp
$root = (Get-Location).Path

if (-not (Test-Path (Join-Path $root "package.json"))) {
    throw "Run this script from the BSMP repository root."
}

$status = git status --porcelain
if ($status) {
    throw "Working tree is not clean. Commit/stash your current changes first:`n$status"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root ".bsmp-backup-$timestamp"
New-Item -ItemType Directory -Path $backup | Out-Null

function Replace-Once {
    param(
        [string]$Path,
        [string]$Old,
        [string]$New
    )

    $content = Get-Content -Raw -LiteralPath $Path
    if (-not $content.Contains($Old)) {
        throw "Expected text was not found in $Path. No partial edit was made to this file."
    }

    Set-Content -LiteralPath $Path -Value ($content.Replace($Old, $New)) -NoNewline
}

$tools = Join-Path $root "apps\web\src\features\observation\InterpretationTools.tsx"
$workspace = Join-Path $root "apps\web\src\features\observation\ObservationWorkspace.tsx"

Copy-Item $tools (Join-Path $backup "InterpretationTools.tsx")
Copy-Item $workspace (Join-Path $backup "ObservationWorkspace.tsx")

Replace-Once $tools @'
export interface InterpretationToolsProps {
    readonly interpretations: readonly InterpretationViewModel[];
    readonly observations: readonly ObservationViewModel[];
    readonly workspace: ObservationWorkspaceService;
    readonly onSaved: () => Promise<void> | void;
}
'@ @'
export interface InterpretationToolsProps {
    readonly interpretations: readonly InterpretationViewModel[];
    readonly observations: readonly ObservationViewModel[];
    readonly workspace: ObservationWorkspaceService;
    readonly onSaved: () => Promise<void> | void;
    readonly onChanged?: (interpretation: InterpretationViewModel) => void;
    readonly onEvidenceChanged?: (
        interpretationId: string,
        evidence: InterpretationViewModel["evidence"][number],
    ) => void;
    readonly onEvidenceRollback?: (
        interpretationId: string,
        evidenceId: string,
    ) => void;
}
'@

Replace-Once $tools @'
export function InterpretationTools({
    interpretations,
    observations,
    workspace,
    onSaved,
}: InterpretationToolsProps) {
'@ @'
export function InterpretationTools({
    interpretations,
    observations,
    workspace,
    onSaved,
    onChanged,
    onEvidenceChanged,
    onEvidenceRollback,
}: InterpretationToolsProps) {
'@

Replace-Once $tools @'
        try {
            await workspace.updateInterpretation(selected.id, statement, selectedObservationIds);
            await onSaved();
            setMessage("Interpretation updated.");
            setEditingId(null);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to update interpretation.");
        }
'@ @'
        const previous = selected;
        const next: InterpretationViewModel = {
            ...selected,
            statement: statement.trim(),
            observationIds: [...selectedObservationIds],
        };

        onChanged?.(next);
        setEditingId(null);
        setMessage("Interpretation updated.");

        try {
            await workspace.updateInterpretation(selected.id, next.statement, next.observationIds);
            void onSaved();
        } catch (reason) {
            onChanged?.(previous);
            setEditingId(selected.id);
            setError(reason instanceof Error ? reason.message : "Unable to update interpretation.");
        }
'@

Replace-Once $tools @'
        try {
            await workspace.addEvidence(interpretationId, evidenceType, evidenceDescription);
            await onSaved();
            setEvidenceDescription("");
            setMessage("Evidence added.");
            setError(null);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to save evidence.");
        }
'@ @'
        const description = evidenceDescription.trim();
        const optimisticEvidence: InterpretationViewModel["evidence"][number] = {
            id: crypto.randomUUID(),
            type: evidenceType,
            description,
            createdAt: new Date().toISOString(),
        };

        onEvidenceChanged?.(interpretationId, optimisticEvidence);
        setEvidenceDescription("");
        setMessage("Evidence added.");
        setError(null);

        try {
            await workspace.addEvidence(interpretationId, evidenceType, description);
            void onSaved();
        } catch (reason) {
            onEvidenceRollback?.(interpretationId, optimisticEvidence.id);
            setError(reason instanceof Error ? reason.message : "Unable to save evidence.");
        }
'@

Replace-Once $workspace @'
    function targetObservationFromMarkup(verse: StudyVerse, markup: StudyWordMarkup, word: string) {
        setSelectedVerses([verse]);
        setTargetWord(word);
        setTargetMarkup(markup);
        window.requestAnimationFrame(() => {
            observationComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }
'@ @'
    function targetObservationFromMarkup(verse: StudyVerse, markup: StudyWordMarkup, word: string) {
        setSelectedVerses([verse]);
        setTargetWord(word);
        setTargetMarkup(markup);
        window.requestAnimationFrame(() => {
            observationComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }

    function addOptimisticInterpretation(interpretation: ObservationWorkspaceData["interpretations"][number]) {
        setData((current) => current
            ? { ...current, interpretations: [...current.interpretations, interpretation] }
            : current);
    }

    function rollbackOptimisticInterpretation(id: string) {
        setData((current) => current
            ? { ...current, interpretations: current.interpretations.filter((item) => item.id !== id) }
            : current);
    }

    function updateInterpretation(next: ObservationWorkspaceData["interpretations"][number]) {
        setData((current) => current
            ? {
                ...current,
                interpretations: current.interpretations.map((item) =>
                    item.id === next.id ? next : item),
            }
            : current);
    }

    function addOptimisticEvidence(
        interpretationId: string,
        evidence: ObservationWorkspaceData["interpretations"][number]["evidence"][number],
    ) {
        setData((current) => current
            ? {
                ...current,
                interpretations: current.interpretations.map((item) =>
                    item.id === interpretationId
                        ? { ...item, evidence: [...item.evidence, evidence] }
                        : item),
            }
            : current);
    }

    function rollbackOptimisticEvidence(interpretationId: string, evidenceId: string) {
        setData((current) => current
            ? {
                ...current,
                interpretations: current.interpretations.map((item) =>
                    item.id === interpretationId
                        ? { ...item, evidence: item.evidence.filter((evidence) => evidence.id !== evidenceId) }
                        : item),
            }
            : current);
    }
'@

Replace-Once $workspace @'
            <InterpretationComposer workspace={workspace} observations={data.observations} onSaved={refreshWorkspace} />
'@ @'
            <InterpretationComposer
                workspace={workspace}
                observations={data.observations}
                onSaved={refreshWorkspace}
                onOptimisticCreate={addOptimisticInterpretation}
                onRollbackCreate={rollbackOptimisticInterpretation}
            />
'@

Replace-Once $workspace @'
            <InterpretationTools interpretations={data.interpretations} observations={data.observations} workspace={workspace} onSaved={refreshWorkspace} />
'@ @'
            <InterpretationTools
                interpretations={data.interpretations}
                observations={data.observations}
                workspace={workspace}
                onSaved={refreshWorkspace}
                onChanged={updateInterpretation}
                onEvidenceChanged={addOptimisticEvidence}
                onEvidenceRollback={rollbackOptimisticEvidence}
            />
'@

Set-Location $root
git diff --check
Write-Host ""
Write-Host "Optimistic Interpretation/Evidence changes applied."
Write-Host "Backup created at: $backup"
Write-Host ""
Write-Host "Next:"
Write-Host "  pnpm build"
Write-Host "  pnpm typecheck"
Write-Host "  pnpm test"
Write-Host ""
Write-Host "If all pass:"
Write-Host "  git add apps/web/src/features/observation/InterpretationTools.tsx apps/web/src/features/observation/ObservationWorkspace.tsx"
Write-Host "  git commit -m ""feat(web): optimistically update interpretations and evidence"""
Write-Host "  git push origin feat/observation-workspace-route"
