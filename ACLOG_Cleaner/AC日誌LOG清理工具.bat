<# :
@echo off
chcp 65001 >nul
title AC日誌LOG清理工具
set "SCRIPT_PATH=%~f0"

:: 檢查是否具備系統管理員權限，若無則自動申請提權 (使用 fltmc 避免 Server 服務停用時誤判)
fltmc >nul 2>&1
if %errorLevel% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:SCRIPT_PATH -Verb RunAs"
    exit /b
)

:: 啟動內嵌的 PowerShell 清理引擎 (改用 ScriptBlock 執行，報錯行號精準且免疫路徑特殊字元)
powershell -NoProfile -ExecutionPolicy Bypass -Command "& ([ScriptBlock]::Create([System.IO.File]::ReadAllText($env:SCRIPT_PATH, [System.Text.Encoding]::UTF8)))"
exit /b
#>

# ==============================================================================
#                              AC日誌LOG清理工具
# ==============================================================================
# 【規則參數說明】
#   Name       : 顯示在畫面上的規則名稱
#   Path       : 資料夾完整路徑
#   KeepDays   : 保留最新的幾個「有紀錄的日期(開機日)」(0 = 全部清空；3 = 保留最新 3 個日期的檔案)
#   MaxAgeDays : (選填) 自然日過期上限，搭配 KeepDays > 0 使用；凡檔案日期距今天超過此天數一律淘汰
#   Filter     : 檔名過濾規則 (預設 "*.log" 代表所有 log 檔；也可指定特定檔名、前綴或萬用字元)
#   Recurse    : 是否連同內部的子資料夾一起掃描 ($true = 是, $false = 否)
#   PerSubDir  : (選填) 是否將該路徑下的每個第一層子目錄視為獨立單位各自計算保留天數 ($true / $false)
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
$Rules.Add(@{ Name = "HTML";                      Path = "$BasePath\HTML";              KeepDays = 3; Filter = "Type*_*.log"; Recurse = $false })
$Rules.Add(@{ Name = "KeyboardSDK";               Path = "$BasePath\KeyboardSDK";       KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "LightingService";           Path = "$BasePath\LightingService";   KeepDays = 3; Filter = "LightingService.log*"; Recurse = $false })
$Rules.Add(@{ Name = "MouseSDK";                  Path = "$BasePath\MouseSDK";          KeepDays = 3; Filter = "*.log"; Recurse = $false })
$Rules.Add(@{ Name = "ROG Live Service";          Path = "$BasePath\ROG Live Service";  KeepDays = 3; Filter = "ROGLiveService_*.log"; Recurse = $false })
$Rules.Add(@{ Name = "UnifyScanner";              Path = "$BasePath\UnifyScanner";      KeepDays = 3; Filter = "*.log"; Recurse = $false })

# --- 3. 偶發性更新紀錄區：保留最新 3 個開機日，且距今超過 7 個自然日自動淘汰 ---
$Rules.Add(@{ Name = "ASUS Update (ACS AppLog)";  Path = "$BasePath\ASUS Update\ACS\AppLog"; KeepDays = 3; MaxAgeDays = 7; Filter = "*.log"; Recurse = $false })

# --- 4. 多子目錄獨立計算區 (引擎自動偵測第一層各子目錄，各自獨立保留最新 3 個開機日) ---
$Rules.Add(@{ Name = "Framework";                 Path = "$BasePath\Framework";         KeepDays = 3; Filter = "*.log"; Recurse = $false; PerSubDir = $true })
$Rules.Add(@{ Name = "MainSDK";                   Path = "$BasePath\MainSDK";           KeepDays = 3; Filter = "*.log"; Recurse = $false; PerSubDir = $true })

# --- 5. 使用者個人資料夾區 (自動偵測電腦內所有使用者帳號的 AppData\Local) ---
$UserFolders = @(Get-ChildItem -LiteralPath "C:\Users" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notin @("Public", "Default", "Default User", "All Users") })
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

# 輔助函式：取得檔案對應的日期字串 (支援 YYYY-MM-DD、YYYY_MM_DD、YYYYMMDD，若無則取檔案修改日期)
function Get-FileLogDate ($File) {
    if ($File.BaseName -match '(?<!\d)(20[0-3]\d)[-_]?(0[1-9]|1[0-2])[-_]?(0[1-9]|[12]\d|3[01])(?!\d)') {
        return "$($matches[1])-$($matches[2])-$($matches[3])"
    }
    return $File.LastWriteTime.ToString('yyyy-MM-dd')
}

# 輔助函式：自動轉換檔案大小顯示單位 (KB / MB)
function Format-FileSize ($Bytes) {
    if ($Bytes -ge 1MB) {
        return "{0:N2} MB" -f ($Bytes / 1MB)
    }
    return "{0:N1} KB" -f ($Bytes / 1KB)
}

# 展開啟用 PerSubDir 的規則，使每個第一層子目錄皆成為獨立計算的規則項目
$ExpandedRules = [System.Collections.Generic.List[hashtable]]::new()
foreach ($Rule in $Rules) {
    if ($Rule.PerSubDir -and (Test-Path -LiteralPath $Rule.Path)) {
        $SubDirs = @(Get-ChildItem -LiteralPath $Rule.Path -Directory -ErrorAction SilentlyContinue)
        if ($SubDirs.Count -gt 0) {
            # 若母目錄本身也直接散落符合條件的日誌檔，一併納入獨立規則避免遺漏
            $RootFiles = @(Get-ChildItem -LiteralPath $Rule.Path -Filter $Rule.Filter -File -ErrorAction SilentlyContinue)
            if ($RootFiles.Count -gt 0) {
                $RootRule = $Rule.Clone()
                $RootRule.Name = "$($Rule.Name) (根目錄)"
                $RootRule.PerSubDir = $false
                $ExpandedRules.Add($RootRule)
            }
            foreach ($SubDir in $SubDirs) {
                # 僅在目錄名稱超過 24 字元時縮短顯示 (避免 MainSDK 具名子目錄撞名，同時維持 Framework 隨機碼精簡)
                $ShortName = if ($SubDir.Name.Length -gt 24) { "$($SubDir.Name.Substring(0,12))..." } else { $SubDir.Name }
                $SubRule = $Rule.Clone()
                $SubRule.Name = "$($Rule.Name) (子目錄: $ShortName)"
                $SubRule.Path = $SubDir.FullName
                $SubRule.PerSubDir = $false
                $ExpandedRules.Add($SubRule)
            }
            continue
        }
    }
    $ExpandedRules.Add($Rule)
}

$FilesToDelete = New-Object System.Collections.Generic.List[System.IO.FileInfo]
$RuleIndex = 0

foreach ($Rule in $ExpandedRules) {
    $RuleIndex++
    $HasMaxAge = ($null -ne $Rule.MaxAgeDays) -and ($Rule.MaxAgeDays -gt 0)
    if ($Rule.KeepDays -le 0) {
        $KeepText = "全部清空"
    } elseif ($HasMaxAge) {
        $KeepText = "保留最新 $($Rule.KeepDays) 個紀錄日，且限 $($Rule.MaxAgeDays) 天內"
    } else {
        $KeepText = "保留最新 $($Rule.KeepDays) 個紀錄日"
    }

    Write-Host "[規則 $RuleIndex] $($Rule.Name) ($KeepText | 目標: $($Rule.Filter))" -ForegroundColor Yellow
    Write-Host "  路徑: $($Rule.Path)" -ForegroundColor DarkGray

    if (-not (Test-Path -LiteralPath $Rule.Path)) {
        Write-Host "  -> 電腦無此資料夾，自動略過。" -ForegroundColor DarkGray
        Write-Host ""
        continue
    }

    # 取得符合條件之檔案 (統一使用 -LiteralPath 並以 @() 強制轉為陣列)
    if ($Rule.Recurse) {
        $Files = @(Get-ChildItem -LiteralPath $Rule.Path -Filter $Rule.Filter -File -Recurse -ErrorAction SilentlyContinue)
    } else {
        $Files = @(Get-ChildItem -LiteralPath $Rule.Path -Filter $Rule.Filter -File -ErrorAction SilentlyContinue)
    }

    if ($Files.Count -eq 0) {
        Write-Host "  -> 資料夾內無符合條件之日誌檔。" -ForegroundColor Green
        Write-Host ""
        continue
    }

    # 為每個檔案標記所屬日期
    $FileEntries = @(foreach ($File in $Files) {
        [PSCustomObject]@{
            File    = $File
            DateStr = Get-FileLogDate $File
        }
    })

    # 判斷哪些檔案需要刪除
    if ($Rule.KeepDays -le 0) {
        $TargetEntries = $FileEntries
    } else {
        # 取出所有不重複的日期，由新到舊排序
        $UniqueDates = @($FileEntries | Select-Object -ExpandProperty DateStr -Unique | Sort-Object -Descending)

        # 若有設定 MaxAgeDays，先剔除超過自然日上限的舊日期，再從有效日期中挑出最新 N 天
        if ($HasMaxAge) {
            $CutoffDateStr = (Get-Date).Date.AddDays(-$Rule.MaxAgeDays).ToString('yyyy-MM-dd')
            $ValidDates = @($UniqueDates | Where-Object { $_ -ge $CutoffDateStr })
            $KeepDates = @($ValidDates | Select-Object -First $Rule.KeepDays)
        } else {
            $KeepDates = @($UniqueDates | Select-Object -First $Rule.KeepDays)
        }

        if ($KeepDates.Count -gt 0) {
            Write-Host "  -> 系統保留日期: $($KeepDates -join ', ')" -ForegroundColor DarkCyan
        } elseif ($HasMaxAge) {
            Write-Host "  -> 系統保留日期: 無 (現有檔案皆已超過 $($Rule.MaxAgeDays) 天自然日上限，基準日: $CutoffDateStr)" -ForegroundColor DarkCyan
        }

        $TargetEntries = @($FileEntries | Where-Object { $KeepDates -notcontains $_.DateStr })
    }

    $MatchedCount = 0
    foreach ($Entry in $TargetEntries) {
        $FilesToDelete.Add($Entry.File)
        $MatchedCount++
        $SizeStr = Format-FileSize $Entry.File.Length
        Write-Host "  -> 待刪舊檔: $($Entry.File.Name) ($SizeStr | 日期: $($Entry.DateStr))" -ForegroundColor Gray
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
$SizeDisplay = Format-FileSize $TotalBytes

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

$FreedDisplay = Format-FileSize $FreedBytes

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "清理完成！成功刪除: $DeletedCount 個檔案 (釋放 $FreedDisplay)" -ForegroundColor Green
if ($SkippedCount -gt 0) {
    Write-Host "略過無法清理之檔案: $SkippedCount 個 (正由 AC 背景服務寫入中)" -ForegroundColor Yellow
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "請按 Enter 鍵關閉視窗"
