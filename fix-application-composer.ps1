$ErrorActionPreference = "Stop"

$repo = "C:\Users\johan\bsmp"
$file = Join-Path $repo "apps\web\src\features\observation\ApplicationComposer.tsx"

if (-not (Test-Path $file)) {
    throw "ApplicationComposer.tsx was not found at $file"
}

$content = Get-Content $file -Raw

$old = @'
        const values = [principle, personal, ministry, action].map((value) => value.trim());
        if (!interpretationId || values.some((value) => !value)) {
            setError("Complete all four application fields and select an interpretation.");
            return;
        }
'@

$new = @'
        const principleValue = principle.trim();
        const personalValue = personal.trim();
        const ministryValue = ministry.trim();
        const actionValue = action.trim();

        if (!interpretationId || !principleValue || !personalValue || !ministryValue || !actionValue) {
            setError("Complete all four application fields and select an interpretation.");
            return;
        }
'@

if (-not $content.Contains($old)) {
    throw "Expected ApplicationComposer validation block was not found. No changes were made."
}

$updated = $content.Replace($old, $new)

$updated = $updated.Replace(
'            principle: values[0],
            personal: values[1],
            ministry: values[2],
            action: values[3],',
'            principle: principleValue,
            personal: personalValue,
            ministry: ministryValue,
            action: actionValue,'
)

$updated = $updated.Replace(
'            await workspace.addApplication(interpretationId, values[0], values[1], values[2], values[3]);',
'            await workspace.addApplication(interpretationId, principleValue, personalValue, ministryValue, actionValue);'
)

Set-Content -Path $file -Value $updated -NoNewline

Write-Host "Fixed ApplicationComposer.tsx."
Write-Host ""
Write-Host "Now run:"
Write-Host "  pnpm build"
Write-Host "  pnpm typecheck"
Write-Host "  pnpm test"
