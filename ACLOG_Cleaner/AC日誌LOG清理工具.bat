<# :
@echo off
chcp 65001 >nul
title AC日誌LOG清理工具20261110

:: 檢查是否具備系統管理員權限，若無則自動申請提權
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: 啟動內嵌的 PowerShell 清理引擎
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([System.IO.File]::ReadAllText('%~f0', [System.Text.Encoding]::UTF8))"
exit /b
#>

# ==============================================================================
#                              AC日誌LOG清理工具
# ==============================================================================
# 【規則參數說明】
#   Name       : 顯示在畫面上的規則名稱
#   Path       : 資料夾完整路徑
#   KeepDays   : 保留近幾天的日誌 (設為 0 代表全部清空；設為 3 代表保留近 3 天)
#   Extensions : 要清理的副檔名 (例如 @(".log") 或 @(".log", ".txt"))
#   Recurse    : 是否連同內部的子資料夾一起清理 ($true = 是, $false = 否)
# ==============================================================================

$Rules = @(
    # --- 規則 1：GameFirst (全清 .log) ---
    @{
        Name       = "GameFirst 日誌"
        Path       = "C:\ProgramData\ASUS\ARMOURY CRATE Diagnosis\GameFirst"
        KeepDays   = 0
        Extensions = @(".log")
        Recurse    = $true
    }

    # --- 之後要新增其他 AC 資料夾，請直接往下複製貼上區塊 ---
)

# ==============================================================================
# 以下為核心執行程式，無須修改
# ==============================================================================
$Host.UI.RawUI.WindowTitle = "AC日誌LOG清理工具"
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                     AC日誌LOG清理工具                    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$Today = (Get-Date).Date
$FilesToDelete = New-Object System.Collections.Generic.List[System.IO.FileInfo]
$RuleIndex = 0

foreach ($Rule in $Rules) {
    $RuleIndex++
    $KeepText = if ($Rule.KeepDays -le 0) { "全部清空" } else { "保留近 $($Rule.KeepDays) 天" }
    Write-Host "[規則 $RuleIndex] $($Rule.Name) ($KeepText)" -ForegroundColor Yellow
    Write-Host "  路徑: $($Rule.Path)" -ForegroundColor DarkGray

    if (-not (Test-Path -LiteralPath $Rule.Path)) {
        Write-Host "  -> 找不到此資料夾，自動略過。" -ForegroundColor DarkGray
        Write-Host ""
        continue
    }

    # 取得符合條件之檔案
    if ($Rule.Recurse) {
        $Files = Get-ChildItem -LiteralPath $Rule.Path -File -Recurse -ErrorAction SilentlyContinue
    } else {
        $Files = Get-ChildItem -LiteralPath $Rule.Path -File -ErrorAction SilentlyContinue
    }

    $MatchedCount = 0
    foreach ($File in $Files) {
        # 1. 檢查副檔名是否符合 (不分大小寫)
        if ($Rule.Extensions -notcontains $File.Extension.ToLower()) {
            continue
        }

        # 2. 檢查保留天數
        $ShouldDelete = $false
        $DateInfoText = ""

        if ($Rule.KeepDays -le 0) {
            $ShouldDelete = $true
            $DateInfoText = $File.LastWriteTime.ToString("yyyy-MM-dd")
        } else {
            $CutoffDate = $Today.AddDays(-$Rule.KeepDays)
            $FileDate = $null

            # 優先從檔名抓取 YYYY-MM-DD 日期 (例如 ArmouryCrate.Service_2026-11-10_01.log)
            if ($File.BaseName -match '(\d{4}-\d{2}-\d{2})') {
                try {
                    $FileDate = [datetime]::ParseExact($matches[1], 'yyyy-MM-dd', $null)
                    $DateInfoText = "檔名日期: $($matches[1])"
                } catch {
                    $FileDate = $File.LastWriteTime.Date
                    $DateInfoText = "修改日期: $($File.LastWriteTime.ToString('yyyy-MM-dd'))"
                }
            } else {
                $FileDate = $File.LastWriteTime.Date
                $DateInfoText = "修改日期: $($File.LastWriteTime.ToString('yyyy-MM-dd'))"
            }

            if ($FileDate -lt $CutoffDate) {
                $ShouldDelete = $true
            }
        }

        if ($ShouldDelete) {
            $FilesToDelete.Add($File)
            $MatchedCount++
            $SizeKB = "{0:N1} KB" -f ($File.Length / 1KB)
            Write-Host "  -> 發現: $($File.Name) ($SizeKB | $DateInfoText)" -ForegroundColor Gray
        }
    }

    if ($MatchedCount -eq 0) {
        Write-Host "  -> 無符合條件之舊日誌。" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "----------------------------------------------------------" -ForegroundColor Cyan

if ($FilesToDelete.Count -eq 0) {
    Write-Host "掃描完成！目前沒有任何需要清理的日誌檔案。" -ForegroundColor Green
    Write-Host ""
    Read-Host "請按 Enter 鍵結束程式"
    exit
}

$TotalBytes = ($FilesToDelete | Measure-Object -Property Length -Sum).Sum
$TotalMB = "{0:N2} MB" -f ($TotalBytes / 1MB)
$TotalKB = "{0:N1} KB" -f ($TotalBytes / 1KB)
$SizeDisplay = if ($TotalBytes -ge 1MB) { $TotalMB } else { $TotalKB }

Write-Host "掃描完成！共找到 $($FilesToDelete.Count) 個日誌檔案，預計可釋放 $SizeDisplay 空間。" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor Cyan

$Confirm = Read-Host "請確認以上清單，是否要永久刪除這些檔案？ (輸入 Y 確認刪除 / 其他鍵取消)"
if ($Confirm -notmatch '^[Yy]$') {
    Write-Host ""
    Write-Host "已取消刪除作業，未更動任何檔案。" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "請按 Enter 鍵結束程式"
    exit
}

Write-Host ""
Write-Host "開始執行清理..." -ForegroundColor Cyan

$DeletedCount = 0
$SkippedCount = 0
$FreedBytes = 0

foreach ($File in $FilesToDelete) {
    try {
        $FileSize = $File.Length
        Remove-Item -LiteralPath $File.FullName -Force -ErrorAction Stop
        Write-Host "  [已刪除] $($File.Name)" -ForegroundColor Green
        $DeletedCount++
        $FreedBytes += $FileSize
    } catch {
        Write-Host "  [略過 - 檔案正被系統或背景服務使用中] $($File.Name)" -ForegroundColor Yellow
        $SkippedCount++
    }
}

$FreedMB = "{0:N2} MB" -f ($FreedBytes / 1MB)
$FreedKB = "{0:N1} KB" -f ($FreedBytes / 1KB)
$FreedDisplay = if ($FreedBytes -ge 1MB) { $FreedMB } else { $FreedKB }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "清理完成！成功刪除: $DeletedCount 個檔案 (釋放 $FreedDisplay)" -ForegroundColor Green
if ($SkippedCount -gt 0) {
    Write-Host "略過無法清理之檔案: $SkippedCount 個 (可能正由 AC 背景服務寫入中)" -ForegroundColor Yellow
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "請按 Enter 鍵關閉視窗"