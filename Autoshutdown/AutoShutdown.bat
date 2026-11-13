<# :
@echo off
chcp 65001 >nul
set "BAT_PATH=%~f0"
set "BAT_DIR=%~dp0"
set "BAT_ARGS=%*"
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$batPath = $env:BAT_PATH; $batDir = $env:BAT_DIR; $batArgs = $env:BAT_ARGS; Invoke-Expression ([System.IO.File]::ReadAllText($batPath, [System.Text.Encoding]::UTF8))"
exit /b
#>

# ==============================================================================
# ⚡ 智慧自動關機助手 v1.0 (純綠色無痕版 - 零機碼 / 零 Temp 暫存檔)
#    Designed by fan666rog | https://github.com/fan666rog/web
# ==============================================================================

# --- 0. 單一實例檢查與自動喚醒本尊 (方案 C - 100% 純記憶體訊號) ---
$createdNew = $false
$script:wakeEvent = New-Object System.Threading.EventWaitHandle(
    $false,
    [System.Threading.EventResetMode]::AutoReset,
    "Local\AutoShutdown_fan666rog_WakeEvent",
    [ref]$createdNew
)
if (-not $createdNew) {
    # 發現已有實例在背景或系統匣運作 -> 發送喚醒訊號並立即退出分身
    [void]$script:wakeEvent.Set()
    $script:wakeEvent.Close()
    exit
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# --- 1. 純記憶體反射載入 Windows 底層 API (不產生任何 Temp 編譯垃圾) ---
$domain = [AppDomain]::CurrentDomain
$dynAsm = New-Object System.Reflection.AssemblyName('Win32IdleMemAsm')
$asmBuilder = $domain.DefineDynamicAssembly($dynAsm, [System.Reflection.Emit.AssemblyBuilderAccess]::Run)
$modBuilder = $asmBuilder.DefineDynamicModule('Win32IdleMemMod')
$typeBuilder = $modBuilder.DefineType('Win32Api', [System.Reflection.TypeAttributes]::Public -bor [System.Reflection.TypeAttributes]::Class)

$pinvoke1 = $typeBuilder.DefinePInvokeMethod(
    'GetLastInputInfo', 'user32.dll',
    ([System.Reflection.MethodAttributes]::Public -bor [System.Reflection.MethodAttributes]::Static -bor [System.Reflection.MethodAttributes]::PinvokeImpl),
    [System.Reflection.CallingConventions]::Standard,
    [bool], [Type[]]@([IntPtr]),
    [System.Runtime.InteropServices.CallingConvention]::Winapi,
    [System.Runtime.InteropServices.CharSet]::Auto
)
$pinvoke1.SetImplementationFlags([System.Reflection.MethodImplAttributes]::PreserveSig)

$pinvoke2 = $typeBuilder.DefinePInvokeMethod(
    'GetTickCount', 'kernel32.dll',
    ([System.Reflection.MethodAttributes]::Public -bor [System.Reflection.MethodAttributes]::Static -bor [System.Reflection.MethodAttributes]::PinvokeImpl),
    [System.Reflection.CallingConventions]::Standard,
    [uint32], [Type[]]@(),
    [System.Runtime.InteropServices.CallingConvention]::Winapi,
    [System.Runtime.InteropServices.CharSet]::Auto
)
$pinvoke2.SetImplementationFlags([System.Reflection.MethodImplAttributes]::PreserveSig)

$pinvoke3 = $typeBuilder.DefinePInvokeMethod(
    'SetSuspendState', 'powrprof.dll',
    ([System.Reflection.MethodAttributes]::Public -bor [System.Reflection.MethodAttributes]::Static -bor [System.Reflection.MethodAttributes]::PinvokeImpl),
    [System.Reflection.CallingConventions]::Standard,
    [bool], [Type[]]@([bool], [bool], [bool]),
    [System.Runtime.InteropServices.CallingConvention]::Winapi,
    [System.Runtime.InteropServices.CharSet]::Auto
)
$pinvoke3.SetImplementationFlags([System.Reflection.MethodImplAttributes]::PreserveSig)

$longRef = [long].MakeByRefType()
$pinvoke4 = $typeBuilder.DefinePInvokeMethod(
    'GetSystemTimes', 'kernel32.dll',
    ([System.Reflection.MethodAttributes]::Public -bor [System.Reflection.MethodAttributes]::Static -bor [System.Reflection.MethodAttributes]::PinvokeImpl),
    [System.Reflection.CallingConventions]::Standard,
    [bool], [Type[]]@($longRef, $longRef, $longRef),
    [System.Runtime.InteropServices.CallingConvention]::Winapi,
    [System.Runtime.InteropServices.CharSet]::Auto
)
$pinvoke4.SetImplementationFlags([System.Reflection.MethodImplAttributes]::PreserveSig)

$Win32Api = $typeBuilder.CreateType()

function Get-UserIdleSeconds {
    $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal(8)
    try {
        [System.Runtime.InteropServices.Marshal]::WriteInt32($ptr, 0, 8)
        [System.Runtime.InteropServices.Marshal]::WriteInt32($ptr, 4, 0)
        if ($Win32Api::GetLastInputInfo($ptr)) {
            $rawInt = [System.Runtime.InteropServices.Marshal]::ReadInt32($ptr, 4)
            $lastInput = [System.BitConverter]::ToUInt32([System.BitConverter]::GetBytes($rawInt), 0)
            $tickCount = [uint32]$Win32Api::GetTickCount()
            if ($tickCount -ge $lastInput) {
                $diff = $tickCount - $lastInput
            } else {
                $diff = ([uint32]::MaxValue - $lastInput) + $tickCount + 1
            }
            return [int][Math]::Floor($diff / 1000.0)
        }
    } finally {
        [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
    }
    return 0
}

# --- 2. 硬體監測初始化 (100% 純記憶體 GetSystemTimes 與 網路流量) ---
$script:prevIdleTime   = [long]0
$script:prevKernelTime = [long]0
$script:prevUserTime   = [long]0
[void]$Win32Api::GetSystemTimes([ref]$script:prevIdleTime, [ref]$script:prevKernelTime, [ref]$script:prevUserTime)

$script:lastNetBytes = [long]-1
$script:lastNetTime = [DateTime]::Now

function Get-HardwareMetrics {
    $cpuVal = 0
    [long]$idle   = 0
    [long]$kernel = 0
    [long]$user   = 0
    if ($Win32Api::GetSystemTimes([ref]$idle, [ref]$kernel, [ref]$user)) {
        $idleDiff   = $idle   - $script:prevIdleTime
        $kernelDiff = $kernel - $script:prevKernelTime
        $userDiff   = $user   - $script:prevUserTime

        $script:prevIdleTime   = $idle
        $script:prevKernelTime = $kernel
        $script:prevUserTime   = $user

        $totalSys = $kernelDiff + $userDiff
        if ($totalSys -gt 0) {
            $busy = $totalSys - $idleDiff
            $pct = [int][Math]::Round(($busy * 100.0) / $totalSys)
            $cpuVal = [Math]::Max(0, [Math]::Min(100, $pct))
        }
    }

    $netKBps = 0
    try {
        $ifaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() | Where-Object {
            $_.OperationalStatus -eq 'Up' -and $_.NetworkInterfaceType -ne 'Loopback'
        }
        [long]$totalBytes = 0
        foreach ($nic in $ifaces) {
            try {
                $stats = $nic.GetIPStatistics()
                $totalBytes += ($stats.BytesReceived + $stats.BytesSent)
            } catch {}
        }
        $now = [DateTime]::Now
        if ($script:lastNetBytes -ge 0) {
            $sec = ($now - $script:lastNetTime).TotalSeconds
            if ($sec -gt 0 -and $totalBytes -ge $script:lastNetBytes) {
                $netKBps = [int][Math]::Round((($totalBytes - $script:lastNetBytes) / 1024.0) / $sec)
            }
        }
        $script:lastNetBytes = $totalBytes
        $script:lastNetTime = $now
    } catch { $netKBps = 0 }

    return @{ CPU = $cpuVal; NetKB = $netKBps }
}

# --- 3. 路徑與 INI 設定檔讀寫系統 ---
$iniPath = Join-Path $batDir "config.ini"
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder "AutoShutdown_Helper.lnk"
$isSilentLaunch = ($batArgs -match "-silent")

$defaultConfig = @{
    Mode               = "B"          # A:指定時間, B:倒數, C:每日, D:純閒置
    SpecDate           = ([DateTime]::Now.AddHours(1).ToString("yyyy-MM-dd"))
    SpecHour           = ([DateTime]::Now.AddHours(1).Hour)
    SpecMin            = ([DateTime]::Now.AddHours(1).Minute)
    CountHours         = 1
    CountMins          = 30
    DailyHour          = 0
    DailyMin           = 30
    DelayIfBusy        = $true        # 忙碌延後保護
    EarlyIfIdle        = $false       # 閒置提早觸發
    IdleMins           = 10           # 預設閒置 10 分鐘
    CheckCPU           = $true
    CPULimit           = 15
    CheckNet           = $true
    NetLimitKB         = 100
    ActionType         = 0            # 0:關機, 1:重開機, 2:睡眠, 3:休眠
    PreNotify          = $true
    PreNotifyMins      = 3
    AutoStartup        = $false
    IsRunning          = $false
    TargetTimestamp    = ""
    LastTriggeredDate  = ""
}

function Save-IniConfig($cfg) {
    $lines = @(
        "[Settings]",
        "Mode=$($cfg.Mode)",
        "SpecDate=$($cfg.SpecDate)",
        "SpecHour=$($cfg.SpecHour)",
        "SpecMin=$($cfg.SpecMin)",
        "CountHours=$($cfg.CountHours)",
        "CountMins=$($cfg.CountMins)",
        "DailyHour=$($cfg.DailyHour)",
        "DailyMin=$($cfg.DailyMin)",
        "DelayIfBusy=$($cfg.DelayIfBusy)",
        "EarlyIfIdle=$($cfg.EarlyIfIdle)",
        "IdleMins=$($cfg.IdleMins)",
        "CheckCPU=$($cfg.CheckCPU)",
        "CPULimit=$($cfg.CPULimit)",
        "CheckNet=$($cfg.CheckNet)",
        "NetLimitKB=$($cfg.NetLimitKB)",
        "ActionType=$($cfg.ActionType)",
        "PreNotify=$($cfg.PreNotify)",
        "PreNotifyMins=$($cfg.PreNotifyMins)",
        "AutoStartup=$($cfg.AutoStartup)",
        "[Runtime]",
        "IsRunning=$($cfg.IsRunning)",
        "TargetTimestamp=$($cfg.TargetTimestamp)",
        "LastTriggeredDate=$($cfg.LastTriggeredDate)"
    )
    try {
        [System.IO.File]::WriteAllLines($iniPath, $lines, [System.Text.Encoding]::UTF8)
    } catch {}
}

function Load-IniConfig {
    $cfg = $defaultConfig.Clone()
    if (Test-Path $iniPath) {
        try {
            $lines = [System.IO.File]::ReadAllLines($iniPath, [System.Text.Encoding]::UTF8)
            foreach ($line in $lines) {
                if ($line -match "^([^=\[\]]+)=(.*)$") {
                    $k = $matches[1].Trim()
                    $v = $matches[2].Trim()
                    if ($cfg.ContainsKey($k)) {
                        if ($defaultConfig[$k] -is [bool]) {
                            $cfg[$k] = ($v -eq "True" -or $v -eq "true" -or $v -eq "1")
                        } elseif ($defaultConfig[$k] -is [int]) {
                            $parsed = 0
                            if ([int]::TryParse($v, [ref]$parsed)) { $cfg[$k] = $parsed }
                        } else {
                            $cfg[$k] = $v
                        }
                    }
                }
            }
        } catch {}
    }
    return $cfg
}

function Sync-StartupShortcut([bool]$enable) {
    if ($enable) {
        try {
            $wsh = New-Object -ComObject WScript.Shell
            $sc = $wsh.CreateShortcut($shortcutPath)
            $sc.TargetPath = $batPath
            $sc.Arguments = "-silent"
            $sc.WorkingDirectory = $batDir
            $sc.WindowStyle = 7
            $sc.Description = "智慧自動關機助手背景待命"
            $sc.Save()
            [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($sc)
            [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($wsh)
        } catch {}
    } else {
        if (Test-Path $shortcutPath) {
            try { Remove-Item $shortcutPath -Force } catch {}
        }
    }
}

$script:cfg = Load-IniConfig

# --- 4. 執行階段狀態變數 ---
$script:isTaskRunning = $false
$script:targetTime = [DateTime]::MaxValue
$script:idleConditionMetSince = $null
$script:qualifiedIdleSeconds = 0
$script:idleCooldownUntil = [DateTime]::MinValue
$script:isInDelayProtect = $false
$script:isInAlertBuffer = $false
$script:alertTriggerReason = "" # "Time" or "Idle"
$script:alertEndTime = [DateTime]::MaxValue
$script:alertRemainingSeconds = 0
$script:alertSnoozed = $false
$script:allowExit = $false
$script:lastTickTime = [DateTime]::Now

# --- 5. 建立 GUI 視窗與控制項 ---
$fontMain  = New-Object System.Drawing.Font("Microsoft JhengHei UI", 9.5)
$fontBold  = New-Object System.Drawing.Font("Microsoft JhengHei UI", 9.5, [System.Drawing.FontStyle]::Bold)
$fontTitle = New-Object System.Drawing.Font("Microsoft JhengHei UI", 11, [System.Drawing.FontStyle]::Bold)
$fontDash  = New-Object System.Drawing.Font("Microsoft JhengHei UI", 11, [System.Drawing.FontStyle]::Bold)
$fontSmall = New-Object System.Drawing.Font("Microsoft JhengHei UI", 9)

# 定義按鈕啟用與停用顏色
$colorStartActive  = [System.Drawing.Color]::FromArgb(25, 135, 84)
$colorStopActive   = [System.Drawing.Color]::FromArgb(220, 53, 69)
$colorBtnDisabled  = [System.Drawing.Color]::FromArgb(215, 218, 222)
$colorTextActive   = [System.Drawing.Color]::White
$colorTextDisabled = [System.Drawing.Color]::FromArgb(140, 145, 150)

$form = New-Object System.Windows.Forms.Form
$form.Text = "⚡ 智慧自動關機助手 v1.0 (純綠色免安裝版)"
$form.Size = New-Object System.Drawing.Size(590, 715)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedSingle
$form.MaximizeBox = $false
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.Font = $fontMain
$form.Icon = [System.Drawing.SystemIcons]::Shield

# 【頂部狀態儀表板】
$pnlDash = New-Object System.Windows.Forms.Panel
$pnlDash.Location = New-Object System.Drawing.Point(12, 12)
$pnlDash.Size = New-Object System.Drawing.Size(550, 100)
$pnlDash.BackColor = [System.Drawing.Color]::FromArgb(30, 35, 45)
$pnlDash.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($pnlDash)

$lblSysTime = New-Object System.Windows.Forms.Label
$lblSysTime.Location = New-Object System.Drawing.Point(14, 10)
$lblSysTime.Size = New-Object System.Drawing.Size(525, 26)
$lblSysTime.Font = $fontDash
$lblSysTime.ForeColor = [System.Drawing.Color]::FromArgb(180, 205, 235)
$lblSysTime.Text = "現在系統時間： --"
$pnlDash.Controls.Add($lblSysTime)

$lblTargetTime = New-Object System.Windows.Forms.Label
$lblTargetTime.Location = New-Object System.Drawing.Point(14, 38)
$lblTargetTime.Size = New-Object System.Drawing.Size(525, 26)
$lblTargetTime.Font = $fontDash
$lblTargetTime.ForeColor = [System.Drawing.Color]::FromArgb(255, 215, 80)
$lblTargetTime.Text = "目標執行時間： --"
$pnlDash.Controls.Add($lblTargetTime)

$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Location = New-Object System.Drawing.Point(14, 68)
$lblStatus.Size = New-Object System.Drawing.Size(525, 24)
$lblStatus.Font = $fontBold
$lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(120, 230, 140)
$lblStatus.Text = "目前執行狀態： ○ 待命中 (尚未啟動任務)"
$pnlDash.Controls.Add($lblStatus)

# 【1. 觸發模式設定】
$grpMode = New-Object System.Windows.Forms.GroupBox
$grpMode.Location = New-Object System.Drawing.Point(12, 120)
$grpMode.Size = New-Object System.Drawing.Size(550, 215)
$grpMode.Text = " 1. 觸發模式設定 "
$grpMode.Font = $fontBold
$form.Controls.Add($grpMode)

# A. 指定日期時間
$rbModeA = New-Object System.Windows.Forms.RadioButton
$rbModeA.Location = New-Object System.Drawing.Point(16, 26)
$rbModeA.Size = New-Object System.Drawing.Size(145, 24)
$rbModeA.Font = $fontMain
$rbModeA.Text = "A. 指定日期時間："
$grpMode.Controls.Add($rbModeA)

$dtpSpecDate = New-Object System.Windows.Forms.DateTimePicker
$dtpSpecDate.Location = New-Object System.Drawing.Point(165, 24)
$dtpSpecDate.Size = New-Object System.Drawing.Size(125, 24)
$dtpSpecDate.Font = $fontMain
$dtpSpecDate.Format = [System.Windows.Forms.DateTimePickerFormat]::Custom
$dtpSpecDate.CustomFormat = "yyyy/MM/dd"
$grpMode.Controls.Add($dtpSpecDate)

$numSpecHour = New-Object System.Windows.Forms.NumericUpDown
$numSpecHour.Location = New-Object System.Drawing.Point(300, 24)
$numSpecHour.Size = New-Object System.Drawing.Size(50, 24)
$numSpecHour.Font = $fontMain
$numSpecHour.Maximum = 23
$grpMode.Controls.Add($numSpecHour)

$lblA1 = New-Object System.Windows.Forms.Label
$lblA1.Location = New-Object System.Drawing.Point(354, 27)
$lblA1.Size = New-Object System.Drawing.Size(22, 20)
$lblA1.Font = $fontMain
$lblA1.Text = "時"
$grpMode.Controls.Add($lblA1)

$numSpecMin = New-Object System.Windows.Forms.NumericUpDown
$numSpecMin.Location = New-Object System.Drawing.Point(380, 24)
$numSpecMin.Size = New-Object System.Drawing.Size(50, 24)
$numSpecMin.Font = $fontMain
$numSpecMin.Maximum = 59
$grpMode.Controls.Add($numSpecMin)

$lblA2 = New-Object System.Windows.Forms.Label
$lblA2.Location = New-Object System.Drawing.Point(434, 27)
$lblA2.Size = New-Object System.Drawing.Size(22, 20)
$lblA2.Font = $fontMain
$lblA2.Text = "分"
$grpMode.Controls.Add($lblA2)

# B. 倒數計時模式
$rbModeB = New-Object System.Windows.Forms.RadioButton
$rbModeB.Location = New-Object System.Drawing.Point(16, 60)
$rbModeB.Size = New-Object System.Drawing.Size(145, 24)
$rbModeB.Font = $fontMain
$rbModeB.Text = "B. 倒數計時模式："
$grpMode.Controls.Add($rbModeB)

$numCountHour = New-Object System.Windows.Forms.NumericUpDown
$numCountHour.Location = New-Object System.Drawing.Point(165, 58)
$numCountHour.Size = New-Object System.Drawing.Size(60, 24)
$numCountHour.Font = $fontMain
$numCountHour.Maximum = 999
$grpMode.Controls.Add($numCountHour)

$lblB1 = New-Object System.Windows.Forms.Label
$lblB1.Location = New-Object System.Drawing.Point(230, 61)
$lblB1.Size = New-Object System.Drawing.Size(42, 20)
$lblB1.Font = $fontMain
$lblB1.Text = "小時"
$grpMode.Controls.Add($lblB1)

$numCountMin = New-Object System.Windows.Forms.NumericUpDown
$numCountMin.Location = New-Object System.Drawing.Point(275, 58)
$numCountMin.Size = New-Object System.Drawing.Size(60, 24)
$numCountMin.Font = $fontMain
$numCountMin.Maximum = 59
$grpMode.Controls.Add($numCountMin)

$lblB2 = New-Object System.Windows.Forms.Label
$lblB2.Location = New-Object System.Drawing.Point(340, 61)
$lblB2.Size = New-Object System.Drawing.Size(120, 20)
$lblB2.Font = $fontMain
$lblB2.Text = "分鐘後執行"
$grpMode.Controls.Add($lblB2)

# C. 每天固定時間
$rbModeC = New-Object System.Windows.Forms.RadioButton
$rbModeC.Location = New-Object System.Drawing.Point(16, 94)
$rbModeC.Size = New-Object System.Drawing.Size(145, 24)
$rbModeC.Font = $fontMain
$rbModeC.Text = "C. 每天固定時間："
$grpMode.Controls.Add($rbModeC)

$lblC0 = New-Object System.Windows.Forms.Label
$lblC0.Location = New-Object System.Drawing.Point(165, 97)
$lblC0.Size = New-Object System.Drawing.Size(38, 20)
$lblC0.Font = $fontMain
$lblC0.Text = "每天"
$grpMode.Controls.Add($lblC0)

$numDailyHour = New-Object System.Windows.Forms.NumericUpDown
$numDailyHour.Location = New-Object System.Drawing.Point(205, 92)
$numDailyHour.Size = New-Object System.Drawing.Size(50, 24)
$numDailyHour.Font = $fontMain
$numDailyHour.Maximum = 23
$grpMode.Controls.Add($numDailyHour)

$lblC1 = New-Object System.Windows.Forms.Label
$lblC1.Location = New-Object System.Drawing.Point(259, 97)
$lblC1.Size = New-Object System.Drawing.Size(22, 20)
$lblC1.Font = $fontMain
$lblC1.Text = "時"
$grpMode.Controls.Add($lblC1)

$numDailyMin = New-Object System.Windows.Forms.NumericUpDown
$numDailyMin.Location = New-Object System.Drawing.Point(285, 92)
$numDailyMin.Size = New-Object System.Drawing.Size(50, 24)
$numDailyMin.Font = $fontMain
$numDailyMin.Maximum = 59
$grpMode.Controls.Add($numDailyMin)

$lblC2 = New-Object System.Windows.Forms.Label
$lblC2.Location = New-Object System.Drawing.Point(340, 97)
$lblC2.Size = New-Object System.Drawing.Size(190, 20)
$lblC2.Font = $fontMain
$lblC2.ForeColor = [System.Drawing.Color]::DimGray
$lblC2.Text = "分 (強制開啟背景常駐)"
$grpMode.Controls.Add($lblC2)

# D. 純閒置模式
$rbModeD = New-Object System.Windows.Forms.RadioButton
$rbModeD.Location = New-Object System.Drawing.Point(16, 128)
$rbModeD.Size = New-Object System.Drawing.Size(510, 24)
$rbModeD.Font = $fontMain
$rbModeD.Text = "D. 純閒置模式 ： 符合下方【2. 閒置判定標準】持續達標後直接觸發"
$grpMode.Controls.Add($rbModeD)

# 複合連動選項
$chkDelayIfBusy = New-Object System.Windows.Forms.CheckBox
$chkDelayIfBusy.Location = New-Object System.Drawing.Point(18, 160)
$chkDelayIfBusy.Size = New-Object System.Drawing.Size(520, 22)
$chkDelayIfBusy.Font = $fontMain
$chkDelayIfBusy.ForeColor = [System.Drawing.Color]::FromArgb(0, 90, 160)
$chkDelayIfBusy.Text = "◆ 忙碌延後保護：時間到時若電腦非閒置，暫緩並等閒置穩定滿 10 分鐘才執行"
$grpMode.Controls.Add($chkDelayIfBusy)

$chkEarlyIfIdle = New-Object System.Windows.Forms.CheckBox
$chkEarlyIfIdle.Location = New-Object System.Drawing.Point(18, 185)
$chkEarlyIfIdle.Size = New-Object System.Drawing.Size(520, 22)
$chkEarlyIfIdle.Font = $fontMain
$chkEarlyIfIdle.ForeColor = [System.Drawing.Color]::FromArgb(0, 110, 70)
$chkEarlyIfIdle.Text = "⚡ 閒置提早觸發：在 A 或 B 倒數期間若已達下方閒置標準，則提早執行"
$grpMode.Controls.Add($chkEarlyIfIdle)

# 【2. 閒置判定標準】
$grpIdle = New-Object System.Windows.Forms.GroupBox
$grpIdle.Location = New-Object System.Drawing.Point(12, 343)
$grpIdle.Size = New-Object System.Drawing.Size(550, 122)
$grpIdle.Text = " 2. 閒置判定標準 (即時監測預覽，預設 10 分鐘) "
$grpIdle.Font = $fontBold
$form.Controls.Add($grpIdle)

$lblIdle1 = New-Object System.Windows.Forms.Label
$lblIdle1.Location = New-Object System.Drawing.Point(16, 28)
$lblIdle1.Size = New-Object System.Drawing.Size(155, 22)
$lblIdle1.Font = $fontMain
$lblIdle1.Text = "• 鍵鼠無動作持續達："
$grpIdle.Controls.Add($lblIdle1)

$numIdleMins = New-Object System.Windows.Forms.NumericUpDown
$numIdleMins.Location = New-Object System.Drawing.Point(172, 25)
$numIdleMins.Size = New-Object System.Drawing.Size(55, 24)
$numIdleMins.Font = $fontMain
$numIdleMins.Minimum = 1
$numIdleMins.Maximum = 1440
$numIdleMins.Value = 10
$grpIdle.Controls.Add($numIdleMins)

$lblLiveIdle = New-Object System.Windows.Forms.Label
$lblLiveIdle.Location = New-Object System.Drawing.Point(235, 28)
$lblLiveIdle.Size = New-Object System.Drawing.Size(300, 22)
$lblLiveIdle.Font = $fontMain
$lblLiveIdle.Text = "分鐘   (目前鍵鼠無動作：0分00秒)"
$grpIdle.Controls.Add($lblLiveIdle)

$chkCPU = New-Object System.Windows.Forms.CheckBox
$chkCPU.Location = New-Object System.Drawing.Point(18, 60)
$chkCPU.Size = New-Object System.Drawing.Size(152, 22)
$chkCPU.Font = $fontMain
$chkCPU.Text = "且 CPU 使用率低於："
$grpIdle.Controls.Add($chkCPU)

$numCPU = New-Object System.Windows.Forms.NumericUpDown
$numCPU.Location = New-Object System.Drawing.Point(172, 58)
$numCPU.Size = New-Object System.Drawing.Size(55, 24)
$numCPU.Font = $fontMain
$numCPU.Minimum = 1
$numCPU.Maximum = 100
$numCPU.Value = 15
$grpIdle.Controls.Add($numCPU)

$lblLiveCPU = New-Object System.Windows.Forms.Label
$lblLiveCPU.Location = New-Object System.Drawing.Point(235, 61)
$lblLiveCPU.Size = New-Object System.Drawing.Size(300, 22)
$lblLiveCPU.Font = $fontMain
$lblLiveCPU.Text = "%        (目前即時 CPU：0%)"
$grpIdle.Controls.Add($lblLiveCPU)

$chkNet = New-Object System.Windows.Forms.CheckBox
$chkNet.Location = New-Object System.Drawing.Point(18, 92)
$chkNet.Size = New-Object System.Drawing.Size(152, 22)
$chkNet.Font = $fontMain
$chkNet.Text = "且 網路總流量低於："
$grpIdle.Controls.Add($chkNet)

$numNet = New-Object System.Windows.Forms.NumericUpDown
$numNet.Location = New-Object System.Drawing.Point(172, 90)
$numNet.Size = New-Object System.Drawing.Size(65, 24)
$numNet.Font = $fontMain
$numNet.Minimum = 1
$numNet.Maximum = 100000
$numNet.Value = 100
$grpIdle.Controls.Add($numNet)

$lblLiveNet = New-Object System.Windows.Forms.Label
$lblLiveNet.Location = New-Object System.Drawing.Point(245, 93)
$lblLiveNet.Size = New-Object System.Drawing.Size(290, 22)
$lblLiveNet.Font = $fontMain
$lblLiveNet.Text = "KB/s   (目前即時流量：0 KB/s)"
$grpIdle.Controls.Add($lblLiveNet)

# 【3. 動作、通知與背景常駐】
$grpSys = New-Object System.Windows.Forms.GroupBox
$grpSys.Location = New-Object System.Drawing.Point(12, 473)
$grpSys.Size = New-Object System.Drawing.Size(550, 118)
$grpSys.Text = " 3. 系統動作、執行前通知與開機常駐 "
$grpSys.Font = $fontBold
$form.Controls.Add($grpSys)

$lblAct = New-Object System.Windows.Forms.Label
$lblAct.Location = New-Object System.Drawing.Point(16, 28)
$lblAct.Size = New-Object System.Drawing.Size(85, 22)
$lblAct.Font = $fontMain
$lblAct.Text = "• 執行動作："
$grpSys.Controls.Add($lblAct)

$cmbAction = New-Object System.Windows.Forms.ComboBox
$cmbAction.Location = New-Object System.Drawing.Point(105, 24)
$cmbAction.Size = New-Object System.Drawing.Size(180, 24)
$cmbAction.Font = $fontMain
$cmbAction.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
[void]$cmbAction.Items.Add("關機 (Shutdown)")
[void]$cmbAction.Items.Add("重新啟動 (Restart)")
[void]$cmbAction.Items.Add("睡眠 (Sleep)")
[void]$cmbAction.Items.Add("休眠 (Hibernate)")
$cmbAction.SelectedIndex = 0
$grpSys.Controls.Add($cmbAction)

$chkPreNotify = New-Object System.Windows.Forms.CheckBox
$chkPreNotify.Location = New-Object System.Drawing.Point(18, 58)
$chkPreNotify.Size = New-Object System.Drawing.Size(288, 22)
$chkPreNotify.Font = $fontMain
$chkPreNotify.Text = "執行前跳出最上層置頂提醒視窗，緩衝時間："
$grpSys.Controls.Add($chkPreNotify)

$numNotifyMins = New-Object System.Windows.Forms.NumericUpDown
$numNotifyMins.Location = New-Object System.Drawing.Point(308, 56)
$numNotifyMins.Size = New-Object System.Drawing.Size(48, 24)
$numNotifyMins.Font = $fontMain
$numNotifyMins.Minimum = 1
$numNotifyMins.Maximum = 60
$numNotifyMins.Value = 3
$grpSys.Controls.Add($numNotifyMins)

$lblNotM = New-Object System.Windows.Forms.Label
$lblNotM.Location = New-Object System.Drawing.Point(362, 59)
$lblNotM.Size = New-Object System.Drawing.Size(180, 22)
$lblNotM.Font = $fontMain
$lblNotM.Text = "分鐘 (閒置動滑鼠即取消)"
$grpSys.Controls.Add($lblNotM)

$chkAutoStartup = New-Object System.Windows.Forms.CheckBox
$chkAutoStartup.Location = New-Object System.Drawing.Point(18, 88)
$chkAutoStartup.Size = New-Object System.Drawing.Size(520, 22)
$chkAutoStartup.Font = $fontMain
$chkAutoStartup.Text = "開機時自動在右下角背景待命 (僅建立 Startup 啟動捷徑，零機碼寫入)"
$grpSys.Controls.Add($chkAutoStartup)

# 【底部控制按鈕】
$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Location = New-Object System.Drawing.Point(12, 602)
$btnStart.Size = New-Object System.Drawing.Size(205, 40)
$btnStart.Font = $fontTitle
$btnStart.BackColor = $colorStartActive
$btnStart.ForeColor = $colorTextActive
$btnStart.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnStart.FlatAppearance.BorderSize = 0
$btnStart.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnStart.Text = "▶ 啟動任務"
$form.Controls.Add($btnStart)

$btnStop = New-Object System.Windows.Forms.Button
$btnStop.Location = New-Object System.Drawing.Point(227, 602)
$btnStop.Size = New-Object System.Drawing.Size(175, 40)
$btnStop.Font = $fontTitle
$btnStop.BackColor = $colorBtnDisabled
$btnStop.ForeColor = $colorTextDisabled
$btnStop.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnStop.FlatAppearance.BorderSize = 0
$btnStop.Cursor = [System.Windows.Forms.Cursors]::Default
$btnStop.Enabled = $false
$btnStop.Text = "■ 取消 / 停止"
$form.Controls.Add($btnStop)

$btnClean = New-Object System.Windows.Forms.Button
$btnClean.Location = New-Object System.Drawing.Point(412, 602)
$btnClean.Size = New-Object System.Drawing.Size(150, 40)
$btnClean.Font = $fontBold
$btnClean.BackColor = [System.Drawing.Color]::FromArgb(108, 117, 125)
$btnClean.ForeColor = [System.Drawing.Color]::White
$btnClean.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnClean.FlatAppearance.BorderSize = 0
$btnClean.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnClean.Text = "✖ 清除設定退出"
$form.Controls.Add($btnClean)

# 【底部優雅版權列】
$lnkAuthor = New-Object System.Windows.Forms.LinkLabel
$lnkAuthor.Location = New-Object System.Drawing.Point(12, 650)
$lnkAuthor.Size = New-Object System.Drawing.Size(550, 20)
$lnkAuthor.Font = $fontSmall
$lnkAuthor.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
$authorText = "⚡ Designed by fan666rog   |   GitHub 專案主頁   |   v1.0"
$lnkAuthor.Text = $authorText
$lnkAuthor.ForeColor = [System.Drawing.Color]::DimGray
$lnkAuthor.LinkColor = [System.Drawing.Color]::FromArgb(0, 102, 204)
$lnkAuthor.ActiveLinkColor = [System.Drawing.Color]::FromArgb(220, 53, 69)
$lnkAuthor.LinkBehavior = [System.Windows.Forms.LinkBehavior]::HoverUnderline

$lnkAuthor.Links.Clear()
$idx1 = $authorText.IndexOf("fan666rog")
$idx2 = $authorText.IndexOf("GitHub 專案主頁")
if ($idx1 -ge 0) { [void]$lnkAuthor.Links.Add($idx1, 9, "https://github.com/fan666rog/web/tree/main/Autoshutdown") }
if ($idx2 -ge 0) { [void]$lnkAuthor.Links.Add($idx2, 11, "https://github.com/fan666rog/web/tree/main/Autoshutdown") }

$lnkAuthor.Add_LinkClicked({
    param($s, $e)
    try { Start-Process "https://github.com/fan666rog/web/tree/main/Autoshutdown" } catch {}
})
$form.Controls.Add($lnkAuthor)

# --- 6. 右下角系統匣 (NotifyIcon) 與右鍵選單 ---
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Shield
$notifyIcon.Text = "智慧自動關機助手 - 待命中"
$notifyIcon.Visible = $true

$ctxMenu = New-Object System.Windows.Forms.ContextMenuStrip
$miShow = $ctxMenu.Items.Add("顯示主視窗")
$miDelay30 = $ctxMenu.Items.Add("▶ 延後 30 分鐘")
$miCancel = $ctxMenu.Items.Add("■ 取消目前任務")
$miDelay30.Enabled = $false
$miCancel.Enabled = $false
[void]$ctxMenu.Items.Add("-")
$miExit = $ctxMenu.Items.Add("✖ 徹底結束程式")
$notifyIcon.ContextMenuStrip = $ctxMenu

# --- 7. 置頂預警小視窗 (TopMost Alert Form) ---
$alertForm = New-Object System.Windows.Forms.Form
$alertForm.Text = "⚡ 自動執行預警通知"
$alertForm.Size = New-Object System.Drawing.Size(430, 195)
$alertForm.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$alertForm.MaximizeBox = $false
$alertForm.MinimizeBox = $false
$alertForm.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$alertForm.TopMost = $true
$alertForm.BackColor = [System.Drawing.Color]::FromArgb(40, 25, 25)
$alertForm.ForeColor = [System.Drawing.Color]::White
$alertForm.Font = $fontMain

$lblAlertMsg = New-Object System.Windows.Forms.Label
$lblAlertMsg.Location = New-Object System.Drawing.Point(16, 14)
$lblAlertMsg.Size = New-Object System.Drawing.Size(390, 82)
$lblAlertMsg.Font = $fontTitle
$lblAlertMsg.ForeColor = [System.Drawing.Color]::FromArgb(255, 220, 100)
$lblAlertMsg.Text = "即將執行任務..."
$alertForm.Controls.Add($lblAlertMsg)

$btnAlertHide = New-Object System.Windows.Forms.Button
$btnAlertHide.Location = New-Object System.Drawing.Point(16, 108)
$btnAlertHide.Size = New-Object System.Drawing.Size(115, 36)
$btnAlertHide.BackColor = [System.Drawing.Color]::FromArgb(70, 80, 90)
$btnAlertHide.ForeColor = [System.Drawing.Color]::White
$btnAlertHide.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnAlertHide.Text = "知道了 (隱藏)"
$alertForm.Controls.Add($btnAlertHide)

$btnAlertDelay = New-Object System.Windows.Forms.Button
$btnAlertDelay.Location = New-Object System.Drawing.Point(142, 108)
$btnAlertDelay.Size = New-Object System.Drawing.Size(122, 36)
$btnAlertDelay.BackColor = [System.Drawing.Color]::FromArgb(180, 110, 0)
$btnAlertDelay.ForeColor = [System.Drawing.Color]::White
$btnAlertDelay.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnAlertDelay.Text = "延後 30 分鐘"
$alertForm.Controls.Add($btnAlertDelay)

$btnAlertCancel = New-Object System.Windows.Forms.Button
$btnAlertCancel.Location = New-Object System.Drawing.Point(274, 108)
$btnAlertCancel.Size = New-Object System.Drawing.Size(122, 36)
$btnAlertCancel.BackColor = [System.Drawing.Color]::FromArgb(200, 45, 55)
$btnAlertCancel.ForeColor = [System.Drawing.Color]::White
$btnAlertCancel.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnAlertCancel.Text = "立即取消任務"
$alertForm.Controls.Add($btnAlertCancel)

$alertForm.Add_FormClosing({
    param($s, $e)
    if ($e.CloseReason -eq [System.Windows.Forms.CloseReason]::UserClosing) {
        $e.Cancel = $true
        $alertForm.Hide()
        $script:alertSnoozed = $true
    }
})

# --- 8. 輔助邏輯函數 ---
function Show-MainWindowToFront {
    $form.Show()
    $form.WindowState = [System.Windows.Forms.FormWindowState]::Normal
    $form.TopMost = $true
    $form.Activate()
    $form.TopMost = $false
}

function Update-DelayCheckText {
    $m = [int]$numIdleMins.Value
    $chkDelayIfBusy.Text = "◆ 忙碌延後保護：時間到時若電腦非閒置，暫緩並等閒置穩定滿 $m 分鐘才執行"
}

$numIdleMins.Add_ValueChanged({ Update-DelayCheckText })

function Get-UIValuesToConfig {
    if ($rbModeA.Checked) { $script:cfg.Mode = "A" }
    elseif ($rbModeB.Checked) { $script:cfg.Mode = "B" }
    elseif ($rbModeC.Checked) { $script:cfg.Mode = "C" }
    elseif ($rbModeD.Checked) { $script:cfg.Mode = "D" }

    $script:cfg.SpecDate      = $dtpSpecDate.Value.ToString("yyyy-MM-dd")
    $script:cfg.SpecHour      = [int]$numSpecHour.Value
    $script:cfg.SpecMin       = [int]$numSpecMin.Value
    $script:cfg.CountHours    = [int]$numCountHour.Value
    $script:cfg.CountMins     = [int]$numCountMin.Value
    $script:cfg.DailyHour     = [int]$numDailyHour.Value
    $script:cfg.DailyMin      = [int]$numDailyMin.Value
    $script:cfg.DelayIfBusy   = $chkDelayIfBusy.Checked
    $script:cfg.EarlyIfIdle   = $chkEarlyIfIdle.Checked
    $script:cfg.IdleMins      = [int]$numIdleMins.Value
    $script:cfg.CheckCPU      = $chkCPU.Checked
    $script:cfg.CPULimit      = [int]$numCPU.Value
    $script:cfg.CheckNet      = $chkNet.Checked
    $script:cfg.NetLimitKB    = [int]$numNet.Value
    $script:cfg.ActionType    = $cmbAction.SelectedIndex
    $script:cfg.PreNotify     = $chkPreNotify.Checked
    $script:cfg.PreNotifyMins = [int]$numNotifyMins.Value
    $script:cfg.AutoStartup   = $chkAutoStartup.Checked
}

function Apply-ConfigToUI {
    switch ($script:cfg.Mode) {
        "A" { $rbModeA.Checked = $true }
        "B" { $rbModeB.Checked = $true }
        "C" { $rbModeC.Checked = $true }
        "D" { $rbModeD.Checked = $true }
        default { $rbModeB.Checked = $true }
    }
    try { $dtpSpecDate.Value = [DateTime]::ParseExact($script:cfg.SpecDate, "yyyy-MM-dd", $null) } catch { $dtpSpecDate.Value = [DateTime]::Now }
    $numSpecHour.Value   = [Math]::Max(0, [Math]::Min(23, $script:cfg.SpecHour))
    $numSpecMin.Value    = [Math]::Max(0, [Math]::Min(59, $script:cfg.SpecMin))
    $numCountHour.Value  = [Math]::Max(0, [Math]::Min(999, $script:cfg.CountHours))
    $numCountMin.Value   = [Math]::Max(0, [Math]::Min(59, $script:cfg.CountMins))
    $numDailyHour.Value  = [Math]::Max(0, [Math]::Min(23, $script:cfg.DailyHour))
    $numDailyMin.Value   = [Math]::Max(0, [Math]::Min(59, $script:cfg.DailyMin))
    $chkDelayIfBusy.Checked = $script:cfg.DelayIfBusy
    $chkEarlyIfIdle.Checked = $script:cfg.EarlyIfIdle
    $numIdleMins.Value   = [Math]::Max(1, [Math]::Min(1440, $script:cfg.IdleMins))
    $chkCPU.Checked      = $script:cfg.CheckCPU
    $numCPU.Value        = [Math]::Max(1, [Math]::Min(100, $script:cfg.CPULimit))
    $chkNet.Checked      = $script:cfg.CheckNet
    $numNet.Value        = [Math]::Max(1, [Math]::Min(100000, $script:cfg.NetLimitKB))
    $cmbAction.SelectedIndex = [Math]::Max(0, [Math]::Min(3, $script:cfg.ActionType))
    $chkPreNotify.Checked = $script:cfg.PreNotify
    $numNotifyMins.Value = [Math]::Max(1, [Math]::Min(60, $script:cfg.PreNotifyMins))
    $chkAutoStartup.Checked = $script:cfg.AutoStartup
    Update-DelayCheckText
    Update-ModeUIState
}

function Update-ModeUIState {
    if ($rbModeC.Checked) {
        $chkAutoStartup.Checked = $true
        $chkAutoStartup.Enabled = $false
    } else {
        if (-not $script:isTaskRunning) { $chkAutoStartup.Enabled = $true }
    }

    if ($rbModeD.Checked) {
        $chkDelayIfBusy.Enabled = $false
        $chkEarlyIfIdle.Enabled = $false
    } elseif ($rbModeC.Checked) {
        if (-not $script:isTaskRunning) { $chkDelayIfBusy.Enabled = $true }
        $chkEarlyIfIdle.Checked = $false
        $chkEarlyIfIdle.Enabled = $false
    } else {
        if (-not $script:isTaskRunning) {
            $chkDelayIfBusy.Enabled = $true
            $chkEarlyIfIdle.Enabled = $true
        }
    }
}

function Calculate-PreviewTargetTime {
    $now = [DateTime]::Now
    if ($rbModeA.Checked) {
        $d = $dtpSpecDate.Value.Date
        return $d.AddHours([int]$numSpecHour.Value).AddMinutes([int]$numSpecMin.Value)
    } elseif ($rbModeB.Checked) {
        return $now.AddHours([int]$numCountHour.Value).AddMinutes([int]$numCountMin.Value)
    } elseif ($rbModeC.Checked) {
        $todayTarget = $now.Date.AddHours([int]$numDailyHour.Value).AddMinutes([int]$numDailyMin.Value)
        $todayStr = $now.ToString("yyyy-MM-dd")
        if ($now -ge $todayTarget -or $script:cfg.LastTriggeredDate -eq $todayStr) {
            return $todayTarget.AddDays(1)
        }
        return $todayTarget
    }
    return [DateTime]::MaxValue
}

function Set-ControlsLocked([bool]$locked) {
    $grpMode.Enabled = (-not $locked)
    $grpIdle.Enabled = (-not $locked)
    $cmbAction.Enabled = (-not $locked)
    $chkPreNotify.Enabled = (-not $locked)
    $numNotifyMins.Enabled = (-not $locked)
    $chkAutoStartup.Enabled = (-not $locked) -and (-not $rbModeC.Checked)

    $btnStart.Enabled = (-not $locked)
    $btnStop.Enabled  = $locked

    if ($locked) {
        $btnStart.BackColor = $colorBtnDisabled
        $btnStart.ForeColor = $colorTextDisabled
        $btnStart.Cursor    = [System.Windows.Forms.Cursors]::Default

        $btnStop.BackColor  = $colorStopActive
        $btnStop.ForeColor  = $colorTextActive
        $btnStop.Cursor     = [System.Windows.Forms.Cursors]::Hand
    } else {
        $btnStart.BackColor = $colorStartActive
        $btnStart.ForeColor = $colorTextActive
        $btnStart.Cursor    = [System.Windows.Forms.Cursors]::Hand

        $btnStop.BackColor  = $colorBtnDisabled
        $btnStop.ForeColor  = $colorTextDisabled
        $btnStop.Cursor     = [System.Windows.Forms.Cursors]::Default
    }

    $miDelay30.Enabled = $locked
    $miCancel.Enabled  = $locked
}

function Format-TimeSpan([TimeSpan]$ts) {
    if ($ts.TotalSeconds -lt 0) { return "00:00:00" }
    $totalHours = [int][Math]::Floor($ts.TotalHours)
    return ("{0:D2}:{1:D2}:{2:D2}" -f $totalHours, $ts.Minutes, $ts.Seconds)
}

function Start-AlertBuffer([string]$reason, [int]$seconds) {
    $script:isInAlertBuffer = $true
    $script:alertTriggerReason = $reason
    $script:alertRemainingSeconds = [Math]::Max(1, $seconds)
    $script:alertEndTime = ([DateTime]::Now).AddSeconds($script:alertRemainingSeconds)
    $script:alertSnoozed = $false
}

function Start-ShutdownTask([bool]$isResuming = $false) {
    Get-UIValuesToConfig

    if (-not $isResuming) {
        if ($script:cfg.Mode -eq "D") {
            $script:targetTime = [DateTime]::MaxValue
            $script:cfg.TargetTimestamp = ""
        } else {
            $calc = Calculate-PreviewTargetTime
            if ($script:cfg.Mode -eq "A" -and $calc -le [DateTime]::Now) {
                [System.Windows.Forms.MessageBox]::Show("指定的日期與時間已經過去，請重新設定未來時間！", "時間設定提示", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
                return
            }
            if ($script:cfg.Mode -eq "B" -and $script:cfg.CountHours -eq 0 -and $script:cfg.CountMins -eq 0) {
                [System.Windows.Forms.MessageBox]::Show("倒數計時不能為 0 小時 0 分鐘！", "時間設定提示", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
                return
            }
            $script:targetTime = $calc
            $script:cfg.TargetTimestamp = $script:targetTime.ToString("yyyy-MM-dd HH:mm:ss")
        }
    }

    $script:isTaskRunning = $true
    $script:cfg.IsRunning = $true
    $script:idleConditionMetSince = $null
    $script:qualifiedIdleSeconds = 0
    $script:idleCooldownUntil = [DateTime]::MinValue
    $script:isInDelayProtect = $false
    $script:isInAlertBuffer = $false
    $script:alertSnoozed = $false
    $alertForm.Hide()

    Sync-StartupShortcut $script:cfg.AutoStartup
    Save-IniConfig $script:cfg
    Set-ControlsLocked $true
}

function Stop-ShutdownTask {
    $script:isTaskRunning = $false
    $script:cfg.IsRunning = $false
    $script:cfg.TargetTimestamp = ""
    $script:idleConditionMetSince = $null
    $script:qualifiedIdleSeconds = 0
    $script:idleCooldownUntil = [DateTime]::MinValue
    $script:isInDelayProtect = $false
    $script:isInAlertBuffer = $false
    $script:alertSnoozed = $false
    $alertForm.Hide()

    try { Start-Process "shutdown.exe" -ArgumentList "/a" -WindowStyle Hidden -ErrorAction SilentlyContinue } catch {}

    Save-IniConfig $script:cfg
    Set-ControlsLocked $false
    Update-ModeUIState
    $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(120, 230, 140)
    $lblStatus.Text = "目前執行狀態： ○ 待命中 (任務已取消 / 停止)"
    $notifyIcon.Text = "智慧自動關機助手 - 待命中"
}

function Execute-FinalSystemAction {
    $now = [DateTime]::Now
    # 完整重置所有預警與閒置狀態，防止睡眠/休眠喚醒後瞬間重複觸發
    $script:isInAlertBuffer = $false
    $script:alertSnoozed = $false
    $script:isInDelayProtect = $false
    $script:idleConditionMetSince = $null
    $script:qualifiedIdleSeconds = 0
    $script:idleCooldownUntil = [DateTime]::MinValue
    $alertForm.Hide()

    if ($script:cfg.Mode -eq "C") {
        # 依據原本排定的目標日期記錄觸發日，避免跨午夜延後導致隔天排程被吃掉
        $triggeredDateStr = if ($script:targetTime -ne [DateTime]::MaxValue) { $script:targetTime.ToString("yyyy-MM-dd") } else { $now.ToString("yyyy-MM-dd") }
        $script:cfg.LastTriggeredDate = $triggeredDateStr

        $todayTarget = $now.Date.AddHours($script:cfg.DailyHour).AddMinutes($script:cfg.DailyMin)
        if ($now -lt $todayTarget -and $script:cfg.LastTriggeredDate -ne $now.ToString("yyyy-MM-dd")) {
            $nextTarget = $todayTarget
        } else {
            $nextTarget = $todayTarget.AddDays(1)
        }
        $script:targetTime = $nextTarget
        $script:cfg.TargetTimestamp = $nextTarget.ToString("yyyy-MM-dd HH:mm:ss")
        $script:cfg.IsRunning = $true
    } else {
        $script:cfg.LastTriggeredDate = $now.ToString("yyyy-MM-dd")
        $script:isTaskRunning = $false
        $script:cfg.IsRunning = $false
        $script:cfg.TargetTimestamp = ""
    }
    Save-IniConfig $script:cfg

    switch ($script:cfg.ActionType) {
        0 { Start-Process "shutdown.exe" -ArgumentList "/s /t 0" -WindowStyle Hidden }
        1 { Start-Process "shutdown.exe" -ArgumentList "/r /t 0" -WindowStyle Hidden }
        2 { [void]$Win32Api::SetSuspendState($false, $false, $false) }
        3 { [void]$Win32Api::SetSuspendState($true, $false, $false) }
    }

    if ($script:cfg.Mode -ne "C") {
        Stop-ShutdownTask
    }
}

# --- 9. 綁定介面控制項事件 ---
$rbModeA.Add_CheckedChanged({ Update-ModeUIState })
$rbModeB.Add_CheckedChanged({ Update-ModeUIState })
$rbModeC.Add_CheckedChanged({ Update-ModeUIState })
$rbModeD.Add_CheckedChanged({ Update-ModeUIState })

$chkAutoStartup.Add_CheckedChanged({
    if (-not $script:isTaskRunning) {
        $script:cfg.AutoStartup = $chkAutoStartup.Checked
        Sync-StartupShortcut $script:cfg.AutoStartup
        Save-IniConfig $script:cfg
    }
})

$btnStart.Add_Click({ Start-ShutdownTask $false })
$btnStop.Add_Click({ Stop-ShutdownTask })

$btnClean.Add_Click({
    $ans = [System.Windows.Forms.MessageBox]::Show(
        "確定要清除所有設定檔 (config.ini) 與開機啟動捷徑，並徹底退出程式嗎？`n（這將使系統恢復 100% 初始無痕狀態）",
        "清除設定並退出",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )
    if ($ans -eq [System.Windows.Forms.DialogResult]::Yes) {
        Stop-ShutdownTask
        Sync-StartupShortcut $false
        if (Test-Path $iniPath) { try { Remove-Item $iniPath -Force } catch {} }
        $script:allowExit = $true
        $notifyIcon.Visible = $false
        $form.Close()
    }
})

$btnAlertHide.Add_Click({
    $alertForm.Hide()
    $script:alertSnoozed = $true
})

$btnAlertDelay.Add_Click({
    $alertForm.Hide()
    $script:isInAlertBuffer = $false
    $script:alertSnoozed = $false
    $script:isInDelayProtect = $false
    $script:idleConditionMetSince = $null
    $script:qualifiedIdleSeconds = 0

    $now = [DateTime]::Now
    if ($script:cfg.Mode -eq "D") {
        # 純閒置模式下按延後 30 分鐘：保持 Mode D 設定不變，進入 30 分鐘休息暫緩期
        $script:idleCooldownUntil = $now.AddMinutes(30)
    } else {
        # A / B / C 模式：若原本目標時間還在未來則從原目標往後推，否則從現在起算 +30 分鐘
        $baseTime = if ($script:targetTime -gt $now -and $script:targetTime -ne [DateTime]::MaxValue) { $script:targetTime } else { $now }
        $script:targetTime = $baseTime.AddMinutes(30)
        $script:cfg.TargetTimestamp = $script:targetTime.ToString("yyyy-MM-dd HH:mm:ss")
        Save-IniConfig $script:cfg
    }
})

$btnAlertCancel.Add_Click({ Stop-ShutdownTask })

$notifyIcon.Add_DoubleClick({ Show-MainWindowToFront })
$miShow.Add_Click({ Show-MainWindowToFront })

$miDelay30.Add_Click({
    if ($script:isTaskRunning) { $btnAlertDelay.PerformClick() }
})

$miCancel.Add_Click({
    if ($script:isTaskRunning) { Stop-ShutdownTask }
})

$miExit.Add_Click({
    $script:allowExit = $true
    $notifyIcon.Visible = $false
    $alertForm.Close()
    $form.Close()
})

$form.Add_FormClosing({
    param($s, $e)
    # 放行 Windows 系統關機或工作管理員強制結束，避免程式自己阻擋 Windows 關機
    if ($e.CloseReason -eq [System.Windows.Forms.CloseReason]::WindowsShutDown -or
        $e.CloseReason -eq [System.Windows.Forms.CloseReason]::TaskManagerClosing) {
        $script:allowExit = $true
    }
    if (-not $script:allowExit) {
        $e.Cancel = $true
        $form.Hide()
    } else {
        $timer.Stop()
        $notifyIcon.Visible = $false
        $notifyIcon.Dispose()
        if ($null -ne $script:wakeEvent) {
            try { $script:wakeEvent.Close() } catch {}
        }
    }
})

# --- 10. 核心每秒定時器 (1000ms 主迴圈) ---
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({
    # 檢查是否有重複點擊 .bat 傳來的喚醒訊號 (方案 C)
    if ($null -ne $script:wakeEvent -and $script:wakeEvent.WaitOne(0)) {
        Show-MainWindowToFront
    }

    $now = [DateTime]::Now
    # 偵測系統是否剛從睡眠或休眠喚醒 (兩次 Tick 間隔超過 15 秒)
    $tickGap = ($now - $script:lastTickTime).TotalSeconds
    $script:lastTickTime = $now
    if ($tickGap -gt 15) {
        # 系統剛喚醒，重置閒置計時，若為每日模式且剛喚醒時舊目標已過，重新對齊下一次目標
        $script:idleConditionMetSince = $null
        $script:qualifiedIdleSeconds = 0
        if ($script:isTaskRunning -and $script:cfg.Mode -eq "C" -and $now -gt $script:targetTime.AddMinutes(5)) {
            $script:isInAlertBuffer = $false
            $script:isInDelayProtect = $false
            $alertForm.Hide()
            $script:targetTime = Calculate-PreviewTargetTime
            $script:cfg.TargetTimestamp = $script:targetTime.ToString("yyyy-MM-dd HH:mm:ss")
            Save-IniConfig $script:cfg
        }
    }

    $lblSysTime.Text = "現在系統時間： " + $now.ToString("yyyy-MM-dd  HH:mm:ss")

    $userIdleSec = Get-UserIdleSeconds
    $hw = Get-HardwareMetrics
    $idleMinPart = [int][Math]::Floor($userIdleSec / 60.0)
    $idleSecPart = $userIdleSec % 60

    $lblLiveIdle.Text = ("分鐘   (目前鍵鼠無動作：{0}分{1:D2}秒)" -f $idleMinPart, $idleSecPart)
    $lblLiveCPU.Text  = ("%        (目前即時 CPU：{0}%)" -f $hw.CPU)
    $lblLiveNet.Text  = ("KB/s   (目前即時流量：{0} KB/s)" -f $hw.NetKB)

    # 判定當下這一秒是否符合「硬體+鍵鼠」瞬間閒置條件 (採用時間戳差值計算，徹底消除 Timer 漂移)
    $cpuOk = (-not $chkCPU.Checked) -or ($hw.CPU -le [int]$numCPU.Value)
    $netOk = (-not $chkNet.Checked) -or ($hw.NetKB -le [int]$numNet.Value)
    $inputIdle = ($userIdleSec -ge 2)
    $inCooldown = ($now -lt $script:idleCooldownUntil)

    if ((-not $inCooldown) -and $inputIdle -and $cpuOk -and $netOk) {
        if ($null -eq $script:idleConditionMetSince) {
            $script:idleConditionMetSince = $now.AddSeconds(-1)
        }
        $script:qualifiedIdleSeconds = [int][Math]::Floor(($now - $script:idleConditionMetSince).TotalSeconds)
    } else {
        $script:idleConditionMetSince = $null
        $script:qualifiedIdleSeconds = 0
    }

    # 尚未啟動任務：即時動態預覽目標時間
    if (-not $script:isTaskRunning) {
        if ($rbModeD.Checked) {
            $lblTargetTime.Text = ("目標執行時間： 閒置滿 {0} 分鐘後觸發" -f [int]$numIdleMins.Value)
        } else {
            $prev = Calculate-PreviewTargetTime
            $rem = $prev - $now
            $lblTargetTime.Text = ("目標執行時間： {0}  (預覽剩餘 {1})" -f $prev.ToString("yyyy-MM-dd HH:mm:ss"), (Format-TimeSpan $rem))
        }
        return
    }

    # ================= 任務執行中邏輯 =================
    $actName = $cmbAction.SelectedItem.ToString().Split(' ')[0]
    $idleThresholdSec = ([int]$numIdleMins.Value) * 60
    $notifyBufferSec = ([int]$numNotifyMins.Value) * 60

    # 【階段 A：已進入執行前預警通知緩衝期】
    if ($script:isInAlertBuffer) {
        # 若是由「閒置」或「忙碌延後完成」觸發的緩衝，只要使用者動了滑鼠或鍵盤 (< 2秒)，立刻自動取消預警並重置
        if ($script:alertTriggerReason -eq "Idle" -and $userIdleSec -lt 2) {
            $script:isInAlertBuffer = $false
            $script:alertSnoozed = $false
            $script:idleConditionMetSince = $null
            $script:qualifiedIdleSeconds = 0
            $alertForm.Hide()
            return
        }

        $remAlertSpan = $script:alertEndTime - $now
        $script:alertRemainingSeconds = [int][Math]::Ceiling($remAlertSpan.TotalSeconds)
        $remStr = Format-TimeSpan ([TimeSpan]::FromSeconds([Math]::Max(0, $script:alertRemainingSeconds)))
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(255, 110, 110)
        $lblStatus.Text = "目前執行狀態： ● 執行前預警緩衝中！將於 $remStr 後執行【$actName】"
        $notifyIcon.Text = "預警：$remStr 後$actName"

        if ($script:alertTriggerReason -eq "Idle") {
            $lblAlertMsg.Text = "系統已達閒置條件，將於 $remStr 後執行【$actName】！`n`n※ 提示：直接晃動滑鼠或按任意鍵即可自動取消。"
        } else {
            $lblAlertMsg.Text = "預定時間將至，將於 $remStr 後執行【$actName】！`n`n若仍在使用電腦，請點擊下方按鈕延後或取消。"
        }

        if (-not $alertForm.Visible -and -not $script:alertSnoozed) {
            [System.Media.SystemSounds]::Exclamation.Play()
            $alertForm.Show()
        }

        if ($script:alertRemainingSeconds -le 0) {
            Execute-FinalSystemAction
        }
        return
    }

    # 【階段 B：一般監測期 (判斷 D 純閒置 vs A/B/C 定時)】
    if ($script:cfg.Mode -eq "D") {
        if ($inCooldown) {
            $cdSpan = $script:idleCooldownUntil - $now
            $cdStr = Format-TimeSpan $cdSpan
            $lblTargetTime.Text = ("目標執行時間： 延後暫緩中 (將於 {0} 後恢復閒置監測)" -f $cdStr)
            $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(255, 200, 70)
            $lblStatus.Text = "目前執行狀態： ◆ 延後 30 分鐘暫緩期 (倒數 $cdStr)"
            $notifyIcon.Text = "延後暫緩中 ($cdStr)"
            return
        }

        $remIdle = [Math]::Max(0, $idleThresholdSec - $script:qualifiedIdleSeconds)
        $remSpan = [TimeSpan]::FromSeconds($remIdle)
        $lblTargetTime.Text = ("目標執行時間： 符合閒置標準滿 {0} 分鐘 (還需 {1})" -f $script:cfg.IdleMins, (Format-TimeSpan $remSpan))
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(120, 230, 140)
        $lblStatus.Text = ("目前執行狀態： ● 純閒置監測中 (合格閒置累積：{0}分{1:D2}秒)" -f [int][Math]::Floor($script:qualifiedIdleSeconds/60), ($script:qualifiedIdleSeconds%60))
        $notifyIcon.Text = ("閒置監測中 (累積 {0}m/{1}m)" -f [int][Math]::Floor($script:qualifiedIdleSeconds/60), $script:cfg.IdleMins)

        if ($script:qualifiedIdleSeconds -ge $idleThresholdSec) {
            if ($script:cfg.PreNotify) {
                Start-AlertBuffer "Idle" $notifyBufferSec
            } else {
                Execute-FinalSystemAction
            }
        }
        return
    }

    # A / B / C 定時模式
    $remTime = $script:targetTime - $now

    # 1. 檢查是否勾選「閒置提早觸發」(限 A / B)
    if (($script:cfg.Mode -eq "A" -or $script:cfg.Mode -eq "B") -and $script:cfg.EarlyIfIdle) {
        if ($script:qualifiedIdleSeconds -ge $idleThresholdSec) {
            if ($script:cfg.PreNotify) {
                Start-AlertBuffer "Idle" $notifyBufferSec
            } else {
                Execute-FinalSystemAction
            }
            return
        }
    }

    # 2. 若目標時間已經到達 ($remTime <= 0)
    if ($remTime.TotalSeconds -le 0) {
        if ($script:cfg.DelayIfBusy) {
            # 忙碌延後保護：時間到達且確認閒置達標後，再給予 N 分鐘預警緩衝
            if ($script:qualifiedIdleSeconds -ge $idleThresholdSec) {
                if ($script:cfg.PreNotify) {
                    Start-AlertBuffer "Idle" $notifyBufferSec
                } else {
                    Execute-FinalSystemAction
                }
            } else {
                $script:isInDelayProtect = $true
                $waitSec = [Math]::Max(0, $idleThresholdSec - $script:qualifiedIdleSeconds)
                $waitSpan = Format-TimeSpan ([TimeSpan]::FromSeconds($waitSec))
                $lblTargetTime.Text = "目標執行時間： " + $script:targetTime.ToString("yyyy-MM-dd HH:mm:ss") + " (時間已到，延後保護中)"
                $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(255, 200, 70)
                $lblStatus.Text = ("目前執行狀態： ◆ 忙碌延後保護中：等待閒置穩定 (還需 {0})" -f $waitSpan)
                $notifyIcon.Text = "忙碌延後保護中 (還需 $waitSpan)"
            }
        } else {
            # 未勾選忙碌延後 -> 強制準時執行
            if ($script:cfg.PreNotify) {
                Start-AlertBuffer "Time" $notifyBufferSec
            } else {
                Execute-FinalSystemAction
            }
        }
        return
    }

    # 3. 目標時間尚未到達：檢查是否進入「固定時間執行前通知」區間 (僅限未勾選忙碌延後保護時)
    if ($script:cfg.PreNotify -and (-not $script:cfg.DelayIfBusy) -and ($remTime.TotalSeconds -le $notifyBufferSec)) {
        Start-AlertBuffer "Time" ([int][Math]::Ceiling($remTime.TotalSeconds))
        return
    }

    # 更新正常倒數畫面
    $remStr = Format-TimeSpan $remTime
    $lblTargetTime.Text = ("目標執行時間： {0}  (倒數剩餘 {1})" -f $script:targetTime.ToString("yyyy-MM-dd HH:mm:ss"), $remStr)
    $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(120, 230, 140)
    $extraInfo = ""
    if (($script:cfg.Mode -eq "A" -or $script:cfg.Mode -eq "B") -and $script:cfg.EarlyIfIdle) {
        $extraInfo = (" | 閒置累積 {0}m/{1}m" -f [int][Math]::Floor($script:qualifiedIdleSeconds/60), $script:cfg.IdleMins)
    }
    $lblStatus.Text = "目前執行狀態： ● 任務監測倒數中$extraInfo"
    $notifyIcon.Text = "倒數剩餘：$remStr ($actName)"
})

# --- 11. 啟動初始化與狀態恢復檢查 ---
Apply-ConfigToUI
Sync-StartupShortcut $script:cfg.AutoStartup

if ($script:cfg.IsRunning) {
    if ($script:cfg.Mode -eq "D") {
        Start-ShutdownTask $true
    } elseif ($script:cfg.Mode -eq "C") {
        $script:targetTime = Calculate-PreviewTargetTime
        $script:cfg.TargetTimestamp = $script:targetTime.ToString("yyyy-MM-dd HH:mm:ss")
        Start-ShutdownTask $true
    } else {
        $savedTarget = [DateTime]::MinValue
        if ([DateTime]::TryParseExact($script:cfg.TargetTimestamp, "yyyy-MM-dd HH:mm:ss", $null, [System.Globalization.DateTimeStyles]::None, [ref]$savedTarget)) {
            if ($savedTarget -gt [DateTime]::Now) {
                $script:targetTime = $savedTarget
                Start-ShutdownTask $true
            } else {
                $script:cfg.IsRunning = $false
                $script:cfg.TargetTimestamp = ""
                Save-IniConfig $script:cfg
            }
        }
    }
}

$timer.Start()

if ($isSilentLaunch) {
    $form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
    $form.ShowInTaskbar = $false
    $form.Add_Shown({ $form.Hide(); $form.ShowInTaskbar = $true })
}

[System.Windows.Forms.Application]::Run($form)
