$ErrorActionPreference = "Stop"

$repo = "C:\Users\johan\bsmp"
$file = Join-Path $repo "apps\web\src\features\observation\InterpretationTools.tsx"

if (-not (Test-Path -LiteralPath $file)) {
    throw "InterpretationTools.tsx was not found at $file"
}

$content = Get-Content -LiteralPath $file -Raw

# Clear any stale error/success state before beginning an interpretation edit.
# This prevents an older "Interpretation not found" message from remaining visible
# after a later edit succeeds.
$needle = @'
        const previous = selected;
        const next: InterpretationViewModel = {
'@

$replacement = @'
        setError(null);
        setMessage(null);

        const previous = selected;
        const next: InterpretationViewModel = {
'@

if ($content.Contains($needle)) {
    $updated = $content.Replace($needle, $replacement)
} else {
    $pattern = '(?s)(\s+)const previous = selected;\s*const next: InterpretationViewModel = \{'
    if (-not [regex]::IsMatch($content, $pattern)) {
        throw "Could not find the InterpretationTools saveChanges block. No changes were made."
    }

    $updated = [regex]::Replace(
        $content,
        $pattern,
        '$1setError(null);' + "`r`n" + '$1setMessage(null);' + "`r`n`r`n" + '$1const previous = selected;' + "`r`n" + '$1const next: InterpretationViewModel = {',
        1
    )
}

if ($updated -eq $content) {
    throw "No changes were needed."
}

Set-Content -LiteralPath $file -Value $updated -NoNewline

Write-Host "Fixed stale Interpretation error state."
Write-Host ""
Write-Host "Run:"
Write-Host "  pnpm build"
Write-Host "  pnpm typecheck"
Write-Host "  pnpm test"
