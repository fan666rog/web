<# :
@echo off
chcp 65001 >nul
title AC日誌LOG清理工具

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
#   KeepDays   : 保留最新的幾個「有紀錄的日期(開機日)」(0 = 全部清空；3 = 保留最新 3 個日期的檔案)
#   Filter     : 檔名過濾規則 (預設 "*.log" 代表所有 log 檔；也可指定特定檔名或前綴)
#   Recurse    : 是否連同內部的子資料夾一起掃描 ($true = 是, $false = 否)
# ==============================================================================

$BasePath = "C:\ProgramData\ASUS\ARMOURY CRATE Diagnosis"

$Rules = [System.Collections.Generic.List[hashtable]]::new()

# --- 1. 系統共用區：發現即全清 (KeepDays = 0) ---
$Rules.Add(@{ Name = "GameFirst";                 Path = "$BasePath\GameFirst";         KeepDays = 0; Filter = "*.log"; Recurse = $true  })
$Rules.Add(@{ Name = "ErrorReporter (錯誤回報)";  Path = "$BasePath";                   KeepDays = 0; Filter = "ArmouryCrate.ErrorReporter.txt"; Recurse = $false })

# --- 2. 系統共用區：保留最新 3 個開機日 (KeepDays = 3) ---
$Rules.Add(@{ Name = "AacAIOFanSetup";            Path = "$BasePath\AacAIOFanSetup";    KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "AacKBSetup";                Path = "$BasePath\AacKBSetup";        KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "AacMouseSetup";             Path = "$BasePath\AacMouseSetup";     KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "AcNodeAddon";               Path = "$BasePath\AcNodeAddon";       KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "AIOFanSDK";                 Path = "$BasePath\AIOFanSDK";         KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "AppLog (系統)";             Path = "$BasePath\AppLog";            KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "KeyboardSDK";               Path = "$BasePath\KeyboardSDK";       KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "MouseSDK";                  Path = "$BasePath\MouseSDK";          KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "ROG Live Service";          Path = "$BasePath\ROG Live Service";  KeepDays = 3; Filter = "ROGLiveService_*.log"; Recurse = $false })
$Rules.Add(@{ Name = "UnifyScanner";              Path = "$BasePath\UnifyScanner";      KeepDays = 3; Filter = "*.log"; Recurse = $false })

# --- 3. 使用者個人資料夾區 (自動偵測電腦內所有使用者帳號的 AppData\Local) ---
$UserFolders = Get-ChildItem -Path "C:\Users" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notin @("Public", "Default", "Default User", "All Users") }
$AddedUserPaths = @()

foreach ($User in $UserFolders) {
    $UserAppLogPath = Join-Path $User.FullName "AppData\Local\ASUS\Armoury Crate Diagnosis\AppLog"
    if (Test-Path -LiteralPath $UserAppLogPath) {
        $AddedUserPaths += $UserAppLogPath
        $Rules.Add(@{
            Name     = "AppLog - UserSessionHelper (使用者: $($User.Name))"
            Path     = $UserAppLogPath
            KeepDays = 3
            Filter   = "ArmouryCrate.UserSessionHelper_*.log"
            Recurse  = $false
        })
    }
}

# 若電腦無一個帳號存在該資料夾，仍加入一筆當前使用者的預設路徑供畫面顯示「略過」提示
$DefaultUserAppLog = "$env:LOCALAPPDATA\ASUS\Armoury Crate Diagnosis\AppLog"
if ($AddedUserPaths.Count -eq 0) {
    $Rules.Add(@{
        Name     = "AppLog - UserSessionHelper (當前使用者)"
        Path     = $DefaultUserAppLog
        KeepDays = 3
        Filter   = "ArmouryCrate.UserSessionHelper_*.log"
        Recurse  = $false
    })
}

# ==============================================================================
# 以下為核心執行程式，無須修改
# ==============================================================================
$Host.UI.RawUI.WindowTitle = "AC日誌LOG清理工具"
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                     AC日誌LOG清理工具                    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$FilesToDelete = New-Object System.Collections.Generic.List[System.IO.FileInfo]
$RuleIndex = 0

# 輔助函式：取得檔案對應的日期字串 (優先解析檔名中的 YYYY-MM-DD，若無則取檔案修改日期)
function Get-FileLogDate ($File) {
    if ($File.BaseName -match '(\d{4}-\d{2}-\d{2})') {
        return $matches[1]
    }
    return $File.LastWriteTime.ToString('yyyy-MM-dd')
}

foreach ($Rule in $Rules) {
    $RuleIndex++
    $KeepText = if ($Rule.KeepDays -le 0) { "全部清空" } else { "保留最新 $($Rule.KeepDays) 個紀錄日" }
    Write-Host "[規則 $RuleIndex] $($Rule.Name) ($KeepText | 目標: $($Rule.Filter))" -ForegroundColor Yellow
    Write-Host "  路徑: $($Rule.Path)" -ForegroundColor DarkGray

    if (-not (Test-Path -LiteralPath $Rule.Path)) {
        Write-Host "  -> 電腦無此資料夾，自動略過。" -ForegroundColor DarkGray
        Write-Host ""
        continue
    }

    # 取得符合條件之檔案
    if ($Rule.Recurse) {
        $Files = Get-ChildItem -Path $Rule.Path -Filter $Rule.Filter -File -Recurse -ErrorAction SilentlyContinue
    } else {
        $Files = Get-ChildItem -Path $Rule.Path -Filter $Rule.Filter -File -ErrorAction SilentlyContinue
    }

    if (-not $Files -or $Files.Count -eq 0) {
        Write-Host "  -> 資料夾內無符合條件之日誌檔。" -ForegroundColor Green
        Write-Host ""
        continue
    }

    # 為每個檔案標記所屬日期
    $FileEntries = foreach ($File in $Files) {
        [PSCustomObject]@{
            File    = $File
            DateStr = Get-FileLogDate $File
        }
    }

    # 判斷哪些檔案需要刪除
    if ($Rule.KeepDays -le 0) {
        $TargetEntries = $FileEntries
    } else {
        # 取出所有不重複的日期，由新到舊排序，挑出要保留的前 N 個最新日期
        $UniqueDates = $FileEntries | Select-Object -ExpandProperty DateStr -Unique | Sort-Object -Descending
        $KeepDates = $UniqueDates | Select-Object -First $Rule.KeepDays

        if ($KeepDates.Count -gt 0) {
            Write-Host "  -> 系統保留日期: $($KeepDates -join ', ')" -ForegroundColor DarkCyan
        }

        $TargetEntries = $FileEntries | Where-Object { $KeepDates -notcontains $_.DateStr }
    }

    $MatchedCount = 0
    foreach ($Entry in $TargetEntries) {
        $FilesToDelete.Add($Entry.File)
        $MatchedCount++
        $SizeKB = "{0:N1} KB" -f ($Entry.File.Length / 1KB)
        Write-Host "  -> 待刪舊檔: $($Entry.File.Name) ($SizeKB | 日期: $($Entry.DateStr))" -ForegroundColor Gray
    }

    if ($MatchedCount -eq 0) {
        Write-Host "  -> 目前無超過保留範圍之舊日誌。" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "----------------------------------------------------------" -ForegroundColor Cyan

if ($FilesToDelete.Count -eq 0) {
    Write-Host "掃描完成！目前沒有任何需要清理的舊日誌檔案。" -ForegroundColor Green
    Write-Host ""
    Read-Host "請按 Enter 鍵結束程式"
    exit
}

$TotalBytes = ($FilesToDelete | Measure-Object -Property Length -Sum).Sum
$TotalMB = "{0:N2} MB" -f ($TotalBytes / 1MB)
$TotalKB = "{0:N1} KB" -f ($TotalBytes / 1KB)
$SizeDisplay = if ($TotalBytes -ge 1MB) { $TotalMB } else { $TotalKB }

Write-Host "掃描完成！共找到 $($FilesToDelete.Count) 個舊日誌檔案，預計可釋放 $SizeDisplay 空間。" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor Cyan

$Confirm = Read-Host "請確認以上清單，是否要永久刪除這些舊檔案？ (輸入 Y 確認刪除 / 其他鍵取消)"
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
        Write-Host "  [略過 - 檔案正被背景服務使用中] $($File.Name)" -ForegroundColor Yellow
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
    Write-Host "略過無法清理之檔案: $SkippedCount 個 (正由 AC 背景服務寫入中)" -ForegroundColor Yellow
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "請按 Enter 鍵關閉視窗"
