<# :
@echo off
chcp 65001 >nul
set "BAT_PATH=%~f0"
set "BAT_DIR=%~dp0"
set "BAT_ARGS=%*"
powershell.exe -Sta -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$batPath = $env:BAT_PATH; $batDir = $env:BAT_DIR; $batArgs = $env:BAT_ARGS; Invoke-Expression ([System.IO.File]::ReadAllText($batPath, [System.Text.Encoding]::UTF8))"
exit /b
#>

# ==============================================================================
# ⚡ 智慧自動關機助手 v1.6.6 (純綠色無痕版 - 精簡四狀態機 + 雙綠燈漏斗積分引擎)
#    Designed by fan666rog | https://github.com/fan666rog/web
# ==============================================================================

# --- 0. 單一實例檢查與自動喚醒本尊 (100% 純記憶體訊號) ---
$createdNew = $false
$script:wakeEvent = New-Object System.Threading.EventWaitHandle(
    $false,
    [System.Threading.EventResetMode]::AutoReset,
    "Local\AutoShutdown_fan666rog_WakeEvent",
    [ref]$createdNew
)
if (-not $createdNew) {
    [void]$script:wakeEvent.Set()
    $script:wakeEvent.Close()
    exit
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# --- 1. 純記憶體反射載入 Windows 底層 API (零 Temp 編譯垃圾 + 精準 U1 布林封送) ---
$domain = [AppDomain]::CurrentDomain
$dynAsm = New-Object System.Reflection.AssemblyName('Win32IdleMemAsmV166')
$asmBuilder = $domain.DefineDynamicAssembly($dynAsm, [System.Reflection.Emit.AssemblyBuilderAccess]::Run)
$modBuilder = $asmBuilder.DefineDynamicModule('Win32IdleMemModV166')
$typeBuilder = $modBuilder.DefineType('Win32Api', [System.Reflection.TypeAttributes]::Public -bor [System.Reflection.TypeAttributes]::Class)

$marshalAttrCtor = [System.Runtime.InteropServices.MarshalAsAttribute].GetConstructor([Type[]]@([System.Runtime.InteropServices.UnmanagedType]))
$u1AttrBuilder = New-Object System.Reflection.Emit.CustomAttributeBuilder($marshalAttrCtor, @([System.Runtime.InteropServices.UnmanagedType]::U1))

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
($pinvoke3.DefineParameter(0, [System.Reflection.ParameterAttributes]::Retval, $null)).SetCustomAttribute($u1AttrBuilder)

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

$pinvoke5 = $typeBuilder.DefinePInvokeMethod(
    'IsPwrSuspendAllowed', 'powrprof.dll',
    ([System.Reflection.MethodAttributes]::Public -bor [System.Reflection.MethodAttributes]::Static -bor [System.Reflection.MethodAttributes]::PinvokeImpl),
    [System.Reflection.CallingConventions]::Standard,
    [bool], [Type[]]@(),
    [System.Runtime.InteropServices.CallingConvention]::Winapi,
    [System.Runtime.InteropServices.CharSet]::Auto
)
$pinvoke5.SetImplementationFlags([System.Reflection.MethodImplAttributes]::PreserveSig)
($pinvoke5.DefineParameter(0, [System.Reflection.ParameterAttributes]::Retval, $null)).SetCustomAttribute($u1AttrBuilder)

$pinvoke6 = $typeBuilder.DefinePInvokeMethod(
    'IsPwrHibernateAllowed', 'powrprof.dll',
    ([System.Reflection.MethodAttributes]::Public -bor [System.Reflection.MethodAttributes]::Static -bor [System.Reflection.MethodAttributes]::PinvokeImpl),
    [System.Reflection.CallingConventions]::Standard,
    [bool], [Type[]]@(),
    [System.Runtime.InteropServices.CallingConvention]::Winapi,
    [System.Runtime.InteropServices.CharSet]::Auto
)
$pinvoke6.SetImplementationFlags([System.Reflection.MethodImplAttributes]::PreserveSig)
($pinvoke6.DefineParameter(0, [System.Reflection.ParameterAttributes]::Retval, $null)).SetCustomAttribute($u1AttrBuilder)

$pinvoke7 = $typeBuilder.DefinePInvokeMethod(
    'CallNtPowerInformation', 'powrprof.dll',
    ([System.Reflection.MethodAttributes]::Public -bor [System.Reflection.MethodAttributes]::Static -bor [System.Reflection.MethodAttributes]::PinvokeImpl),
    [System.Reflection.CallingConventions]::Standard,
    [int], [Type[]]@([int], [IntPtr], [uint32], [IntPtr], [uint32]),
    [System.Runtime.InteropServices.CallingConvention]::Winapi,
    [System.Runtime.InteropServices.CharSet]::Auto
)
$pinvoke7.SetImplementationFlags([System.Reflection.MethodImplAttributes]::PreserveSig)

$Win32Api = $typeBuilder.CreateType()

# --- 2. 硬體與系統狀態感測模組 ---
function Get-UserIdleSeconds {
    $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal(8)
    try {
        [System.Runtime.InteropServices.Marshal]::WriteInt32($ptr, 0, 8)
        [System.Runtime.InteropServices.Marshal]::WriteInt32($ptr, 4, 0)
        if ($Win32Api::GetLastInputInfo($ptr)) {
            $rawInt = [System.Runtime.InteropServices.Marshal]::ReadInt32($ptr, 4)
            $lastInput = [System.BitConverter]::ToUInt32([System.BitConverter]::GetBytes($rawInt), 0)
            $tickCount = [uint32]$Win32Api::GetTickCount()
            $diff = if ($tickCount -ge $lastInput) {
                $tickCount - $lastInput
            } else {
                ([uint32]::MaxValue - $lastInput) + $tickCount + 1
            }
            return [int][Math]::Floor($diff / 1000.0)
        }
    } finally {
        [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
    }
    return 0
}

function Get-ActivePowerExecutionFlags {
    # 查詢 SystemExecutionState (16)：
    # 0x01 = ES_SYSTEM_REQUIRED (背景關鍵任務)
    # 0x02 = ES_DISPLAY_REQUIRED (全螢幕影片播放)
    # 0x40 = ES_AWAYMODE_REQUIRED (離開模式防休眠，如轉檔/下載器)
    $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal(4)
    try {
        [System.Runtime.InteropServices.Marshal]::WriteInt32($ptr, 0, 0)
        $status = $Win32Api::CallNtPowerInformation(16, [IntPtr]::Zero, [uint32]0, $ptr, [uint32]4)
        if ($status -eq 0) {
            $flags = [System.Runtime.InteropServices.Marshal]::ReadInt32($ptr, 0)
            return ($flags -band 0x00000043)
        }
    } catch {} finally {
        [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
    }
    return 0
}

$script:prevIdleTime   = [long]0
$script:prevKernelTime = [long]0
$script:prevUserTime   = [long]0
[void]$Win32Api::GetSystemTimes([ref]$script:prevIdleTime, [ref]$script:prevKernelTime, [ref]$script:prevUserTime)

$script:lastNetBytes = [long]-1
$script:lastNetTime  = [DateTime]::Now

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
        $ifaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()
        [long]$totalBytes = 0
        foreach ($nic in $ifaces) {
            if ($nic.OperationalStatus -eq 'Up' -and
                $nic.NetworkInterfaceType -ne 'Loopback' -and
                $nic.NetworkInterfaceType -ne 'Tunnel' -and
                $nic.Description -notmatch 'Hyper-V|Virtual|WSL|Pseudo|TAP-|TUN|WireGuard|Wintun|Tailscale|ZeroTier|OpenVPN') {
                try {
                    $stats = $nic.GetIPStatistics()
                    $totalBytes += ($stats.BytesReceived + $stats.BytesSent)
                } catch {}
            }
        }
        $now = [DateTime]::Now
        if ($script:lastNetBytes -ge 0) {
            $sec = ($now - $script:lastNetTime).TotalSeconds
            if ($sec -gt 0 -and $totalBytes -ge $script:lastNetBytes) {
                $netKBps = [int][Math]::Round((($totalBytes - $script:lastNetBytes) / 1024.0) / $sec)
            }
        }
        $script:lastNetBytes = $totalBytes
        $script:lastNetTime  = $now
    } catch {
        $netKBps = 0
    }

    return @{ CPU = $cpuVal; NetKB = $netKBps }
}

# --- 3. 路徑與 INI 設定檔管理系統 (%LocalAppData%\AutoShutdown_Helper) ---
$appDataDir     = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) "AutoShutdown_Helper"
$iniPath        = Join-Path $appDataDir "config.ini"
$startupFolder  = [Environment]::GetFolderPath('Startup')
$shortcutPath   = Join-Path $startupFolder "AutoShutdown_Helper.lnk"
$isSilentLaunch = ($batArgs -match "-silent")

if ([string]::IsNullOrWhiteSpace($batPath) -and (-not [string]::IsNullOrWhiteSpace($PSCommandPath))) {
    $batPath = $PSCommandPath
    $batDir  = Split-Path -Parent $batPath
}

$defaultConfig = @{
    Mode               = "B"          # A:指定時間, B:倒數, C:每日, D:純閒置
    SpecDate           = ([DateTime]::Now.AddHours(1).ToString("yyyy-MM-dd"))
    SpecHour           = ([DateTime]::Now.AddHours(1).Hour)
    SpecMin            = ([DateTime]::Now.AddHours(1).Minute)
    CountHours         = 1
    CountMins          = 30
    DailyHour          = 0
    DailyMin           = 30
    DelayIfBusy        = $true        # 忙碌延後保護 (雙綠燈安全閘門)
    EarlyIfIdle        = $false       # 閒置提早觸發
    IdleMins           = 10           # 漏斗積分目標 (預設 10 分鐘 = 600 分)
    CheckCPU           = $true
    CPULimit           = 15
    CheckNet           = $true
    NetLimitVal        = 100
    NetUnit            = "KB/s"
    CheckPowerReq      = $true        # 偵測全螢幕播放 / 系統防休眠鎖定
    MaxDelayMins       = 120          # 最大延後保險絲上限 (分鐘，0=無限等待)
    ActionType         = 0            # 0:關機, 1:重開機, 2:睡眠, 3:休眠
    PreNotifySecs      = 60           # 強制最後防誤殺確認倒數秒數 (預設 60 秒)
    FallbackToShutdown = $true        # 禁用防呆：睡眠/休眠被系統禁用時自動降級為關機
    ForceBlockedAct    = $false       # 執行關機/重啟時直接強制結束未存檔程式
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
        "NetLimitVal=$($cfg.NetLimitVal)",
        "NetUnit=$($cfg.NetUnit)",
        "CheckPowerReq=$($cfg.CheckPowerReq)",
        "MaxDelayMins=$($cfg.MaxDelayMins)",
        "ActionType=$($cfg.ActionType)",
        "PreNotifySecs=$($cfg.PreNotifySecs)",
        "FallbackToShutdown=$($cfg.FallbackToShutdown)",
        "ForceBlockedAct=$($cfg.ForceBlockedAct)",
        "AutoStartup=$($cfg.AutoStartup)",
        "[Runtime]",
        "IsRunning=$($cfg.IsRunning)",
        "TargetTimestamp=$($cfg.TargetTimestamp)",
        "LastTriggeredDate=$($cfg.LastTriggeredDate)"
    )
    try {
        if (-not (Test-Path $appDataDir)) {
            [void](New-Item -Path $appDataDir -ItemType Directory -Force)
        }
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
                    } elseif ($k -eq "PreNotifyMins") {
                        $legacyMins = 0
                        if ([int]::TryParse($v, [ref]$legacyMins)) {
                            $cfg.PreNotifySecs = [Math]::Max(15, [Math]::Min(600, $legacyMins * 60))
                        }
                    } elseif ($k -eq "NetLimitKB") {
                        $legacyKB = 0
                        if ([int]::TryParse($v, [ref]$legacyKB)) {
                            if ($legacyKB -ge 1024 -and ($legacyKB % 1024 -eq 0)) {
                                $cfg.NetLimitVal = [Math]::Max(1, [Math]::Min(9999, [int]($legacyKB / 1024)))
                                $cfg.NetUnit = "MB/s"
                            } else {
                                $cfg.NetLimitVal = [Math]::Max(1, [Math]::Min(9999, $legacyKB))
                                $cfg.NetUnit = "KB/s"
                            }
                        }
                    }
                }
            }
        } catch {}
    }
    if ($cfg.NetUnit -ne "KB/s" -and $cfg.NetUnit -ne "MB/s") {
        $cfg.NetUnit = "KB/s"
    }
    return $cfg
}

function Sync-StartupShortcut([bool]$enable) {
    if ($enable) {
        if ([string]::IsNullOrWhiteSpace($batPath) -or $batPath -notlike "*.bat") { return }
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

# --- 4. 集中化狀態機定義 (Single Source of Truth - 精簡四狀態機) ---
# EngineState 枚舉值:
#   "Idle"       : 待命中（未啟動任務）
#   "Monitoring" : 任務執行中（雙綠燈監測或嚴格倒數中）
#   "WakeGuard"  : 系統剛從睡眠/休眠喚醒後的短暫冷卻緩衝（60秒防連續誤觸）
#   "Alerting"   : 已進入最後防誤殺確認視窗倒數
$script:state = @{
    EngineState           = "Idle"
    TargetTime            = [DateTime]::MaxValue
    IdleBucketScore       = 0
    LastUserIdleSec       = 0
    WakeGuardUntil        = [DateTime]::MinValue
    AlertTriggerReason    = ""     # "Smart" | "StrictTime" | "ForcedMaxDelay"
    AlertStartTime        = [DateTime]::MaxValue
    AlertEndTime          = [DateTime]::MaxValue
    AlertRemainingSeconds = 0
    AlertSnoozed          = $false
    LastTickTime          = [DateTime]::Now
    AllowExit             = $false
    ForceShowOnStartup    = $false
    IsUpdatingUI          = $false
}

function Reset-TransientRuntimeState {
    $script:state.IdleBucketScore       = 0
    $script:state.LastUserIdleSec       = 0
    $script:state.WakeGuardUntil        = [DateTime]::MinValue
    $script:state.AlertTriggerReason    = ""
    $script:state.AlertStartTime        = [DateTime]::MaxValue
    $script:state.AlertEndTime          = [DateTime]::MaxValue
    $script:state.AlertRemainingSeconds = 0
    $script:state.AlertSnoozed          = $false
}

# --- 5. 建立 GUI 視窗與控制項 ---
$fontMain  = New-Object System.Drawing.Font("Microsoft JhengHei UI", 9.5)
$fontBold  = New-Object System.Drawing.Font("Microsoft JhengHei UI", 9.5, [System.Drawing.FontStyle]::Bold)
$fontTitle = New-Object System.Drawing.Font("Microsoft JhengHei UI", 11, [System.Drawing.FontStyle]::Bold)
$fontDash  = New-Object System.Drawing.Font("Microsoft JhengHei UI", 10.5, [System.Drawing.FontStyle]::Bold)
$fontSmall = New-Object System.Drawing.Font("Microsoft JhengHei UI", 8.5)

$colorStartActive  = [System.Drawing.Color]::FromArgb(25, 135, 84)
$colorStopActive   = [System.Drawing.Color]::FromArgb(220, 53, 69)
$colorBtnDisabled  = [System.Drawing.Color]::FromArgb(215, 218, 222)
$colorTextActive   = [System.Drawing.Color]::White
$colorTextDisabled = [System.Drawing.Color]::FromArgb(140, 145, 150)

$colorLightGreen   = [System.Drawing.Color]::FromArgb(80, 235, 130)
$colorLightAmber   = [System.Drawing.Color]::FromArgb(255, 210, 75)
$colorLightRed     = [System.Drawing.Color]::FromArgb(255, 110, 110)

$form = New-Object System.Windows.Forms.Form
$form.Text = "⚡ 智慧自動關機助手 v1.6.6 (雙綠燈漏斗積分版)"
$form.ClientSize = New-Object System.Drawing.Size(656, 826)
$form.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Dpi
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedSingle
$form.MaximizeBox = $false
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.Font = $fontMain
$form.Icon = [System.Drawing.SystemIcons]::Shield

# 【頂部雙綠燈狀態儀表板】
$pnlDash = New-Object System.Windows.Forms.Panel
$pnlDash.Location = New-Object System.Drawing.Point(12, 12)
$pnlDash.Size = New-Object System.Drawing.Size(632, 106)
$pnlDash.BackColor = [System.Drawing.Color]::FromArgb(28, 33, 43)
$pnlDash.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($pnlDash)

$lblSysTime = New-Object System.Windows.Forms.Label
$lblSysTime.Location = New-Object System.Drawing.Point(14, 10)
$lblSysTime.Size = New-Object System.Drawing.Size(604, 26)
$lblSysTime.Font = $fontDash
$lblSysTime.ForeColor = [System.Drawing.Color]::FromArgb(180, 205, 235)
$lblSysTime.Text = "現在系統時間： --"
$pnlDash.Controls.Add($lblSysTime)

$lblTargetTime = New-Object System.Windows.Forms.Label
$lblTargetTime.Location = New-Object System.Drawing.Point(14, 39)
$lblTargetTime.Size = New-Object System.Drawing.Size(604, 26)
$lblTargetTime.Font = $fontDash
$lblTargetTime.ForeColor = [System.Drawing.Color]::FromArgb(255, 215, 80)
$lblTargetTime.Text = "目標執行時間： --"
$pnlDash.Controls.Add($lblTargetTime)

# 雙綠燈動態彩色狀態列 (使用 FlowLayoutPanel 徹底解決 DPI 縮放文字重疊問題)
$flowStatus = New-Object System.Windows.Forms.FlowLayoutPanel
$flowStatus.Location = New-Object System.Drawing.Point(11, 68)
$flowStatus.Size = New-Object System.Drawing.Size(610, 28)
$flowStatus.WrapContents = $false
$flowStatus.BackColor = [System.Drawing.Color]::Transparent
$pnlDash.Controls.Add($flowStatus)

$lblStatusPrefix = New-Object System.Windows.Forms.Label
$lblStatusPrefix.AutoSize = $true
$lblStatusPrefix.Margin = New-Object System.Windows.Forms.Padding(0, 2, 0, 0)
$lblStatusPrefix.Font = $fontBold
$lblStatusPrefix.ForeColor = [System.Drawing.Color]::FromArgb(200, 210, 225)
$lblStatusPrefix.Text = "雙綠燈狀態："
$flowStatus.Controls.Add($lblStatusPrefix)

$lblStatusG1 = New-Object System.Windows.Forms.Label
$lblStatusG1.AutoSize = $true
$lblStatusG1.Margin = New-Object System.Windows.Forms.Padding(2, 2, 0, 0)
$lblStatusG1.Font = $fontBold
$lblStatusG1.ForeColor = $colorLightGreen
$lblStatusG1.Text = "○ 待命中 (尚未啟動任務)"
$flowStatus.Controls.Add($lblStatusG1)

$lblStatusSep = New-Object System.Windows.Forms.Label
$lblStatusSep.AutoSize = $true
$lblStatusSep.Margin = New-Object System.Windows.Forms.Padding(6, 2, 6, 0)
$lblStatusSep.Font = $fontBold
$lblStatusSep.ForeColor = [System.Drawing.Color]::FromArgb(130, 145, 165)
$lblStatusSep.Text = "|"
$lblStatusSep.Visible = $false
$flowStatus.Controls.Add($lblStatusSep)

$lblStatusG2 = New-Object System.Windows.Forms.Label
$lblStatusG2.AutoSize = $true
$lblStatusG2.Margin = New-Object System.Windows.Forms.Padding(0, 2, 0, 0)
$lblStatusG2.Font = $fontBold
$lblStatusG2.ForeColor = $colorLightAmber
$lblStatusG2.Text = ""
$lblStatusG2.Visible = $false
$flowStatus.Controls.Add($lblStatusG2)

function Set-SingleStatus([string]$text, [System.Drawing.Color]$color) {
    $lblStatusG1.Text = $text
    $lblStatusG1.ForeColor = $color
    $lblStatusSep.Visible = $false
    $lblStatusG2.Visible = $false
}

function Set-DualLightStatus([string]$g1Text, [System.Drawing.Color]$g1Color, [string]$g2Text, [System.Drawing.Color]$g2Color) {
    $lblStatusG1.Text = $g1Text
    $lblStatusG1.ForeColor = $g1Color
    $lblStatusSep.Visible = $true
    $lblStatusG2.Visible = $true
    $lblStatusG2.Text = $g2Text
    $lblStatusG2.ForeColor = $g2Color
}

# 【1. 觸發模式設定】
$grpMode = New-Object System.Windows.Forms.GroupBox
$grpMode.Location = New-Object System.Drawing.Point(12, 126)
$grpMode.Size = New-Object System.Drawing.Size(632, 245)
$grpMode.Text = " 1. 綠燈一：排程意圖設定 "
$grpMode.Font = $fontBold
$form.Controls.Add($grpMode)

# A. 指定日期時間
$rbModeA = New-Object System.Windows.Forms.RadioButton
$rbModeA.Location = New-Object System.Drawing.Point(16, 26)
$rbModeA.Size = New-Object System.Drawing.Size(155, 24)
$rbModeA.Font = $fontMain
$rbModeA.Text = "A. 指定日期時間："
$grpMode.Controls.Add($rbModeA)

$dtpSpecDate = New-Object System.Windows.Forms.DateTimePicker
$dtpSpecDate.Location = New-Object System.Drawing.Point(175, 24)
$dtpSpecDate.Size = New-Object System.Drawing.Size(130, 24)
$dtpSpecDate.Font = $fontMain
$dtpSpecDate.Format = [System.Windows.Forms.DateTimePickerFormat]::Custom
$dtpSpecDate.CustomFormat = "yyyy/MM/dd"
$grpMode.Controls.Add($dtpSpecDate)

$numSpecHour = New-Object System.Windows.Forms.NumericUpDown
$numSpecHour.Location = New-Object System.Drawing.Point(315, 24)
$numSpecHour.Size = New-Object System.Drawing.Size(54, 24)
$numSpecHour.Font = $fontMain
$numSpecHour.Maximum = 23
$grpMode.Controls.Add($numSpecHour)

$lblA1 = New-Object System.Windows.Forms.Label
$lblA1.Location = New-Object System.Drawing.Point(373, 27)
$lblA1.Size = New-Object System.Drawing.Size(24, 20)
$lblA1.Font = $fontMain
$lblA1.Text = "時"
$grpMode.Controls.Add($lblA1)

$numSpecMin = New-Object System.Windows.Forms.NumericUpDown
$numSpecMin.Location = New-Object System.Drawing.Point(400, 24)
$numSpecMin.Size = New-Object System.Drawing.Size(54, 24)
$numSpecMin.Font = $fontMain
$numSpecMin.Maximum = 59
$grpMode.Controls.Add($numSpecMin)

$lblA2 = New-Object System.Windows.Forms.Label
$lblA2.Location = New-Object System.Drawing.Point(458, 27)
$lblA2.Size = New-Object System.Drawing.Size(24, 20)
$lblA2.Font = $fontMain
$lblA2.Text = "分"
$grpMode.Controls.Add($lblA2)

# B. 倒數計時模式
$rbModeB = New-Object System.Windows.Forms.RadioButton
$rbModeB.Location = New-Object System.Drawing.Point(16, 60)
$rbModeB.Size = New-Object System.Drawing.Size(155, 24)
$rbModeB.Font = $fontMain
$rbModeB.Text = "B. 倒數計時模式："
$grpMode.Controls.Add($rbModeB)

$numCountHour = New-Object System.Windows.Forms.NumericUpDown
$numCountHour.Location = New-Object System.Drawing.Point(175, 58)
$numCountHour.Size = New-Object System.Drawing.Size(62, 24)
$numCountHour.Font = $fontMain
$numCountHour.Maximum = 999
$grpMode.Controls.Add($numCountHour)

$lblB1 = New-Object System.Windows.Forms.Label
$lblB1.Location = New-Object System.Drawing.Point(241, 61)
$lblB1.Size = New-Object System.Drawing.Size(44, 20)
$lblB1.Font = $fontMain
$lblB1.Text = "小時"
$grpMode.Controls.Add($lblB1)

$numCountMin = New-Object System.Windows.Forms.NumericUpDown
$numCountMin.Location = New-Object System.Drawing.Point(288, 58)
$numCountMin.Size = New-Object System.Drawing.Size(62, 24)
$numCountMin.Font = $fontMain
$numCountMin.Maximum = 59
$grpMode.Controls.Add($numCountMin)

$lblB2 = New-Object System.Windows.Forms.Label
$lblB2.Location = New-Object System.Drawing.Point(354, 61)
$lblB2.Size = New-Object System.Drawing.Size(120, 20)
$lblB2.Font = $fontMain
$lblB2.Text = "分鐘後執行"
$grpMode.Controls.Add($lblB2)

# C. 每天固定時間
$rbModeC = New-Object System.Windows.Forms.RadioButton
$rbModeC.Location = New-Object System.Drawing.Point(16, 94)
$rbModeC.Size = New-Object System.Drawing.Size(155, 24)
$rbModeC.Font = $fontMain
$rbModeC.Text = "C. 每天固定時間："
$grpMode.Controls.Add($rbModeC)

$lblC0 = New-Object System.Windows.Forms.Label
$lblC0.Location = New-Object System.Drawing.Point(175, 97)
$lblC0.Size = New-Object System.Drawing.Size(40, 20)
$lblC0.Font = $fontMain
$lblC0.Text = "每天"
$grpMode.Controls.Add($lblC0)

$numDailyHour = New-Object System.Windows.Forms.NumericUpDown
$numDailyHour.Location = New-Object System.Drawing.Point(217, 92)
$numDailyHour.Size = New-Object System.Drawing.Size(54, 24)
$numDailyHour.Font = $fontMain
$numDailyHour.Maximum = 23
$grpMode.Controls.Add($numDailyHour)

$lblC1 = New-Object System.Windows.Forms.Label
$lblC1.Location = New-Object System.Drawing.Point(275, 97)
$lblC1.Size = New-Object System.Drawing.Size(24, 20)
$lblC1.Font = $fontMain
$lblC1.Text = "時"
$grpMode.Controls.Add($lblC1)

$numDailyMin = New-Object System.Windows.Forms.NumericUpDown
$numDailyMin.Location = New-Object System.Drawing.Point(302, 92)
$numDailyMin.Size = New-Object System.Drawing.Size(54, 24)
$numDailyMin.Font = $fontMain
$numDailyMin.Maximum = 59
$grpMode.Controls.Add($numDailyMin)

$lblC2 = New-Object System.Windows.Forms.Label
$lblC2.Location = New-Object System.Drawing.Point(360, 97)
$lblC2.Size = New-Object System.Drawing.Size(240, 20)
$lblC2.Font = $fontMain
$lblC2.ForeColor = [System.Drawing.Color]::DimGray
$lblC2.Text = "分 (強制開啟背景常駐)"
$grpMode.Controls.Add($lblC2)

# D. 純閒置模式
$rbModeD = New-Object System.Windows.Forms.RadioButton
$rbModeD.Location = New-Object System.Drawing.Point(16, 128)
$rbModeD.Size = New-Object System.Drawing.Size(600, 24)
$rbModeD.Font = $fontMain
$rbModeD.Text = "D. 純閒置模式 ： 綠燈一常亮，只要下方【綠燈二安全積分】滿分即觸發"
$grpMode.Controls.Add($rbModeD)

# 雙綠燈連動選項
$chkDelayIfBusy = New-Object System.Windows.Forms.CheckBox
$chkDelayIfBusy.Location = New-Object System.Drawing.Point(18, 160)
$chkDelayIfBusy.Size = New-Object System.Drawing.Size(600, 22)
$chkDelayIfBusy.Font = $fontMain
$chkDelayIfBusy.ForeColor = [System.Drawing.Color]::FromArgb(0, 90, 160)
$chkDelayIfBusy.Text = "◆ 忙碌延後保護：需等【綠燈一(時間到) ＋ 綠燈二(安全積分滿分)】同時亮起才執行"
$grpMode.Controls.Add($chkDelayIfBusy)

# 最大延後保險絲上限設定列
$lblMaxDelay1 = New-Object System.Windows.Forms.Label
$lblMaxDelay1.Location = New-Object System.Drawing.Point(38, 187)
$lblMaxDelay1.Size = New-Object System.Drawing.Size(172, 22)
$lblMaxDelay1.Font = $fontMain
$lblMaxDelay1.ForeColor = [System.Drawing.Color]::FromArgb(80, 90, 105)
$lblMaxDelay1.Text = "└ 最大延後保護上限："
$grpMode.Controls.Add($lblMaxDelay1)

$numMaxDelayMins = New-Object System.Windows.Forms.NumericUpDown
$numMaxDelayMins.Location = New-Object System.Drawing.Point(212, 185)
$numMaxDelayMins.Size = New-Object System.Drawing.Size(62, 24)
$numMaxDelayMins.Font = $fontMain
$numMaxDelayMins.Minimum = 0
$numMaxDelayMins.Maximum = 1440
$numMaxDelayMins.Value = 120
$grpMode.Controls.Add($numMaxDelayMins)

$lblMaxDelay2 = New-Object System.Windows.Forms.Label
$lblMaxDelay2.Location = New-Object System.Drawing.Point(280, 187)
$lblMaxDelay2.Size = New-Object System.Drawing.Size(335, 22)
$lblMaxDelay2.Font = $fontMain
$lblMaxDelay2.ForeColor = [System.Drawing.Color]::DimGray
$lblMaxDelay2.Text = "分鐘後強制執行 (設為 0 = 無限等待直到真正閒置)"
$grpMode.Controls.Add($lblMaxDelay2)

$chkEarlyIfIdle = New-Object System.Windows.Forms.CheckBox
$chkEarlyIfIdle.Location = New-Object System.Drawing.Point(18, 214)
$chkEarlyIfIdle.Size = New-Object System.Drawing.Size(600, 22)
$chkEarlyIfIdle.Font = $fontMain
$chkEarlyIfIdle.ForeColor = [System.Drawing.Color]::FromArgb(0, 110, 70)
$chkEarlyIfIdle.Text = "⚡ 閒置提早觸發：在 A 或 B 倒數期間，只要【綠燈二安全積分】滿分即提早觸發"
$grpMode.Controls.Add($chkEarlyIfIdle)

# 【2. 綠燈二：安全可關（漏斗積分制）】
$grpIdle = New-Object System.Windows.Forms.GroupBox
$grpIdle.Location = New-Object System.Drawing.Point(12, 379)
$grpIdle.Size = New-Object System.Drawing.Size(632, 152)
$grpIdle.Text = " 2. 綠燈二：安全閒置漏斗積分 (安靜 +1分/秒 | 負載超標 -5分/秒 | 鍵鼠操作歸零) "
$grpIdle.Font = $fontBold
$form.Controls.Add($grpIdle)

$lblIdle1 = New-Object System.Windows.Forms.Label
$lblIdle1.Location = New-Object System.Drawing.Point(16, 28)
$lblIdle1.Size = New-Object System.Drawing.Size(160, 22)
$lblIdle1.Font = $fontMain
$lblIdle1.Text = "• 積分滿分目標："
$grpIdle.Controls.Add($lblIdle1)

$numIdleMins = New-Object System.Windows.Forms.NumericUpDown
$numIdleMins.Location = New-Object System.Drawing.Point(178, 25)
$numIdleMins.Size = New-Object System.Drawing.Size(60, 24)
$numIdleMins.Font = $fontMain
$numIdleMins.Minimum = 1
$numIdleMins.Maximum = 1440
$numIdleMins.Value = 10
$grpIdle.Controls.Add($numIdleMins)

$lblLiveIdle = New-Object System.Windows.Forms.Label
$lblLiveIdle.Location = New-Object System.Drawing.Point(244, 28)
$lblLiveIdle.Size = New-Object System.Drawing.Size(375, 22)
$lblLiveIdle.Font = $fontMain
$lblLiveIdle.Text = "分鐘 (積分: 0/600 | 鍵鼠無動作: 0分00秒)"
$grpIdle.Controls.Add($lblLiveIdle)

$chkCPU = New-Object System.Windows.Forms.CheckBox
$chkCPU.Location = New-Object System.Drawing.Point(18, 60)
$chkCPU.Size = New-Object System.Drawing.Size(158, 22)
$chkCPU.Font = $fontMain
$chkCPU.Text = "且 CPU 使用率低於："
$grpIdle.Controls.Add($chkCPU)

$numCPU = New-Object System.Windows.Forms.NumericUpDown
$numCPU.Location = New-Object System.Drawing.Point(178, 58)
$numCPU.Size = New-Object System.Drawing.Size(60, 24)
$numCPU.Font = $fontMain
$numCPU.Minimum = 1
$numCPU.Maximum = 100
$numCPU.Value = 15
$grpIdle.Controls.Add($numCPU)

$lblLiveCPU = New-Object System.Windows.Forms.Label
$lblLiveCPU.Location = New-Object System.Drawing.Point(244, 61)
$lblLiveCPU.Size = New-Object System.Drawing.Size(370, 22)
$lblLiveCPU.Font = $fontMain
$lblLiveCPU.Text = "%      (目前即時 CPU：0%)"
$grpIdle.Controls.Add($lblLiveCPU)

$chkNet = New-Object System.Windows.Forms.CheckBox
$chkNet.Location = New-Object System.Drawing.Point(18, 91)
$chkNet.Size = New-Object System.Drawing.Size(158, 22)
$chkNet.Font = $fontMain
$chkNet.Text = "且 網路總流量低於："
$grpIdle.Controls.Add($chkNet)

$numNet = New-Object System.Windows.Forms.NumericUpDown
$numNet.Location = New-Object System.Drawing.Point(178, 89)
$numNet.Size = New-Object System.Drawing.Size(64, 24)
$numNet.Font = $fontMain
$numNet.Minimum = 1
$numNet.Maximum = 9999
$numNet.Value = 100
$grpIdle.Controls.Add($numNet)

$cmbNetUnit = New-Object System.Windows.Forms.ComboBox
$cmbNetUnit.Location = New-Object System.Drawing.Point(246, 89)
$cmbNetUnit.Size = New-Object System.Drawing.Size(64, 24)
$cmbNetUnit.Font = $fontMain
$cmbNetUnit.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
[void]$cmbNetUnit.Items.Add("KB/s")
[void]$cmbNetUnit.Items.Add("MB/s")
$cmbNetUnit.SelectedIndex = 0
$grpIdle.Controls.Add($cmbNetUnit)

$lblLiveNet = New-Object System.Windows.Forms.Label
$lblLiveNet.Location = New-Object System.Drawing.Point(316, 92)
$lblLiveNet.Size = New-Object System.Drawing.Size(300, 22)
$lblLiveNet.Font = $fontMain
$lblLiveNet.Text = "(目前即時流量：0 KB/s)"
$grpIdle.Controls.Add($lblLiveNet)

$chkPowerReq = New-Object System.Windows.Forms.CheckBox
$chkPowerReq.Location = New-Object System.Drawing.Point(18, 121)
$chkPowerReq.Size = New-Object System.Drawing.Size(405, 22)
$chkPowerReq.Font = $fontMain
$chkPowerReq.Text = "偵測全螢幕播放 / 系統防休眠鎖定 (避免追劇或更新誤關)"
$grpIdle.Controls.Add($chkPowerReq)

$lblLivePwrReq = New-Object System.Windows.Forms.Label
$lblLivePwrReq.Location = New-Object System.Drawing.Point(426, 122)
$lblLivePwrReq.Size = New-Object System.Drawing.Size(195, 22)
$lblLivePwrReq.Font = $fontMain
$lblLivePwrReq.ForeColor = [System.Drawing.Color]::DimGray
$lblLivePwrReq.Text = "(目前：無電源鎖定)"
$grpIdle.Controls.Add($lblLivePwrReq)

# 【3. 系統動作、防誤殺確認與禁用防呆】
$grpSys = New-Object System.Windows.Forms.GroupBox
$grpSys.Location = New-Object System.Drawing.Point(12, 539)
$grpSys.Size = New-Object System.Drawing.Size(632, 192)
$grpSys.Text = " 3. 系統動作、防誤殺確認與禁用防呆 "
$grpSys.Font = $fontBold
$form.Controls.Add($grpSys)

$lblAct = New-Object System.Windows.Forms.Label
$lblAct.Location = New-Object System.Drawing.Point(16, 27)
$lblAct.Size = New-Object System.Drawing.Size(88, 22)
$lblAct.Font = $fontMain
$lblAct.Text = "• 執行動作："
$grpSys.Controls.Add($lblAct)

$cmbAction = New-Object System.Windows.Forms.ComboBox
$cmbAction.Location = New-Object System.Drawing.Point(108, 24)
$cmbAction.Size = New-Object System.Drawing.Size(260, 24)
$cmbAction.Font = $fontMain
$cmbAction.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
[void]$cmbAction.Items.Add("關機 (Shutdown)")
[void]$cmbAction.Items.Add("重新啟動 (Restart)")
[void]$cmbAction.Items.Add("睡眠 (Sleep)")
[void]$cmbAction.Items.Add("休眠 (Hibernate)")
$cmbAction.SelectedIndex = 0
$grpSys.Controls.Add($cmbAction)

$lblPwrCaps = New-Object System.Windows.Forms.Label
$lblPwrCaps.Location = New-Object System.Drawing.Point(376, 27)
$lblPwrCaps.Size = New-Object System.Drawing.Size(244, 22)
$lblPwrCaps.Font = $fontSmall
$lblPwrCaps.ForeColor = [System.Drawing.Color]::DimGray
$lblPwrCaps.Text = "電源狀態偵測中..."
$grpSys.Controls.Add($lblPwrCaps)

$lblPreNotify = New-Object System.Windows.Forms.Label
$lblPreNotify.Location = New-Object System.Drawing.Point(16, 58)
$lblPreNotify.Size = New-Object System.Drawing.Size(354, 22)
$lblPreNotify.Font = $fontMain
$lblPreNotify.Text = "• 條件就緒後，強制跳出最後防誤殺確認視窗，倒數："
$grpSys.Controls.Add($lblPreNotify)

$numNotifySecs = New-Object System.Windows.Forms.NumericUpDown
$numNotifySecs.Location = New-Object System.Drawing.Point(374, 55)
$numNotifySecs.Size = New-Object System.Drawing.Size(58, 24)
$numNotifySecs.Font = $fontMain
$numNotifySecs.Minimum = 15
$numNotifySecs.Maximum = 600
$numNotifySecs.Value = 60
$grpSys.Controls.Add($numNotifySecs)

$lblNotM = New-Object System.Windows.Forms.Label
$lblNotM.Location = New-Object System.Drawing.Point(438, 58)
$lblNotM.Size = New-Object System.Drawing.Size(182, 22)
$lblNotM.Font = $fontMain
$lblNotM.Text = "秒 (動滑鼠自動暫緩本次)"
$grpSys.Controls.Add($lblNotM)

$chkFallbackShutdown = New-Object System.Windows.Forms.CheckBox
$chkFallbackShutdown.Location = New-Object System.Drawing.Point(18, 87)
$chkFallbackShutdown.Size = New-Object System.Drawing.Size(600, 22)
$chkFallbackShutdown.Font = $fontMain
$chkFallbackShutdown.ForeColor = [System.Drawing.Color]::FromArgb(140, 70, 0)
$chkFallbackShutdown.Text = "禁用防呆：若所選【睡眠/休眠】被系統禁用，自動降級為【關機】"
$grpSys.Controls.Add($chkFallbackShutdown)

$chkForceBlocked = New-Object System.Windows.Forms.CheckBox
$chkForceBlocked.Location = New-Object System.Drawing.Point(18, 117)
$chkForceBlocked.Size = New-Object System.Drawing.Size(600, 22)
$chkForceBlocked.Font = $fontMain
$chkForceBlocked.Text = "強制關閉：執行關機/重啟時直接強制結束未存檔程式 (未存檔資料將遺失)"
$grpSys.Controls.Add($chkForceBlocked)

$chkAutoStartup = New-Object System.Windows.Forms.CheckBox
$chkAutoStartup.Location = New-Object System.Drawing.Point(18, 147)
$chkAutoStartup.Size = New-Object System.Drawing.Size(600, 22)
$chkAutoStartup.Font = $fontMain
$chkAutoStartup.Text = "開機時自動在右下角背景待命 (僅建立 Startup 捷徑，請勿移動主程式位置)"
$grpSys.Controls.Add($chkAutoStartup)

# 【底部控制按鈕】
$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Location = New-Object System.Drawing.Point(12, 742)
$btnStart.Size = New-Object System.Drawing.Size(234, 42)
$btnStart.Font = $fontTitle
$btnStart.BackColor = $colorStartActive
$btnStart.ForeColor = $colorTextActive
$btnStart.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnStart.FlatAppearance.BorderSize = 0
$btnStart.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnStart.Text = "▶ 啟動任務"
$form.Controls.Add($btnStart)

$btnStop = New-Object System.Windows.Forms.Button
$btnStop.Location = New-Object System.Drawing.Point(256, 742)
$btnStop.Size = New-Object System.Drawing.Size(204, 42)
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
$btnClean.Location = New-Object System.Drawing.Point(470, 742)
$btnClean.Size = New-Object System.Drawing.Size(174, 42)
$btnClean.Font = $fontBold
$btnClean.BackColor = [System.Drawing.Color]::FromArgb(108, 117, 125)
$btnClean.ForeColor = [System.Drawing.Color]::White
$btnClean.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnClean.FlatAppearance.BorderSize = 0
$btnClean.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnClean.Text = "✖ 清除設定退出"
$form.Controls.Add($btnClean)

# 【底部版權列】
$lnkAuthor = New-Object System.Windows.Forms.LinkLabel
$lnkAuthor.Location = New-Object System.Drawing.Point(12, 792)
$lnkAuthor.Size = New-Object System.Drawing.Size(632, 22)
$lnkAuthor.Font = $fontSmall
$lnkAuthor.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
$authorText = "⚡ Designed by fan666rog   |   GitHub 專案主頁   |   v1.6.6 精簡狀態機穩定版"
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

# --- 6. 右下角系統匣 (NotifyIcon) 與右鍵選單 (精簡無延後雜訊) ---
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Shield
$notifyIcon.Visible = $true

function Set-TrayText([string]$txt) {
    if ([string]::IsNullOrEmpty($txt)) { return }
    if ($txt.Length -gt 60) {
        $txt = $txt.Substring(0, 60)
    }
    try { $notifyIcon.Text = $txt } catch {}
}

Set-TrayText "智慧自動關機助手 v1.6.6 - 待命中"

$ctxMenu = New-Object System.Windows.Forms.ContextMenuStrip
$miShow = $ctxMenu.Items.Add("顯示主視窗")
$miCancel = $ctxMenu.Items.Add("■ 取消目前任務")
$miCancel.Enabled = $false
[void]$ctxMenu.Items.Add("-")
$miExit = $ctxMenu.Items.Add("✖ 徹底結束程式")
$notifyIcon.ContextMenuStrip = $ctxMenu

# --- 7. 置頂預警小視窗 (區分自動暫緩與緊急中止雙保險 + DPI 安全相對排版) ---
$alertForm = New-Object System.Windows.Forms.Form
$alertForm.Text = "⚡ 最後防誤殺確認通知"
$alertForm.ClientSize = New-Object System.Drawing.Size(470, 236)
$alertForm.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Dpi
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
$lblAlertMsg.Size = New-Object System.Drawing.Size(438, 150)
$lblAlertMsg.Font = $fontTitle
$lblAlertMsg.ForeColor = [System.Drawing.Color]::FromArgb(255, 220, 100)
$lblAlertMsg.Text = "即將執行任務..."
$alertForm.Controls.Add($lblAlertMsg)

$btnAlertHide = New-Object System.Windows.Forms.Button
$btnAlertHide.Location = New-Object System.Drawing.Point(16, 180)
$btnAlertHide.Size = New-Object System.Drawing.Size(211, 38)
$btnAlertHide.BackColor = [System.Drawing.Color]::FromArgb(70, 80, 90)
$btnAlertHide.ForeColor = [System.Drawing.Color]::White
$btnAlertHide.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnAlertHide.Text = "知道了 (隱藏視窗繼續倒數)"
$alertForm.Controls.Add($btnAlertHide)

$btnAlertCancel = New-Object System.Windows.Forms.Button
$btnAlertCancel.Location = New-Object System.Drawing.Point(243, 180)
$btnAlertCancel.Size = New-Object System.Drawing.Size(211, 38)
$btnAlertCancel.BackColor = [System.Drawing.Color]::FromArgb(200, 45, 55)
$btnAlertCancel.ForeColor = [System.Drawing.Color]::White
$btnAlertCancel.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnAlertCancel.Text = "立即取消任務"
$alertForm.Controls.Add($btnAlertCancel)

$alertForm.Add_FormClosing({
    param($s, $e)
    if ($script:state.AllowExit) { return }
    if ($e.CloseReason -eq [System.Windows.Forms.CloseReason]::UserClosing) {
        $e.Cancel = $true
        [System.Media.SystemSounds]::Beep.Play()
    }
})

function Render-AlertStateUI([string]$actName, [string]$fallbackNote) {
    $now = [DateTime]::Now
    $remAlertSpan = $script:state.AlertEndTime - $now
    $script:state.AlertRemainingSeconds = [int][Math]::Ceiling($remAlertSpan.TotalSeconds)
    $remSecDisplay = [Math]::Max(0, $script:state.AlertRemainingSeconds)

    if ($script:cfg.Mode -eq "D" -or $script:state.TargetTime -eq [DateTime]::MaxValue) {
        $lblTargetTime.Text = "目標執行時間： 綠燈二安全積分已滿，正在執行最後防誤殺倒數"
    } else {
        $lblTargetTime.Text = ("目標執行時間： {0}  (已進入最後防誤殺倒數)" -f $script:state.TargetTime.ToString("yyyy-MM-dd HH:mm:ss"))
    }

    Set-SingleStatus "●● 條件就緒！最後防誤殺倒數 ${remSecDisplay} 秒後執行【${actName}】" $colorLightRed
    Set-TrayText "防誤殺確認：${remSecDisplay}秒後${actName}"

    $fbLine = if ($fallbackNote -ne "") { "`n※ $fallbackNote" } else { "" }
    if ($script:state.AlertTriggerReason -eq "Smart") {
        $lblAlertMsg.Text = "雙綠燈已就緒，將於 ${remSecDisplay} 秒後執行【${actName}】！`n• 動滑鼠／按任意鍵：自動「暫緩」本次倒數（繼續監測）`n• 未自動解除或欲徹底「終止」排程：請按下方按鈕${fbLine}"
    } elseif ($script:state.AlertTriggerReason -eq "ForcedMaxDelay") {
        $lblAlertMsg.Text = "已達最大延後上限（逾時 $($script:cfg.MaxDelayMins) 分鐘），將於 ${remSecDisplay} 秒後執行【${actName}】！`n※ 若仍在使用電腦，請點擊下方按鈕取消任務。${fbLine}"
    } else {
        $lblAlertMsg.Text = "預定時間將至（嚴格準時模式），將於 ${remSecDisplay} 秒後執行【${actName}】！`n※ 若仍在使用電腦，請點擊下方按鈕取消任務。${fbLine}"
    }

    if (-not $alertForm.Visible -and (-not $script:state.AlertSnoozed)) {
        [System.Media.SystemSounds]::Exclamation.Play()
        $alertForm.Show()
    }
}

# --- 8. 輔助邏輯函數與系統電源禁用防呆探測 ---
function Get-EffectiveAutoStartup {
    return (($rbModeC.Checked -and $script:cfg.IsRunning) -or $script:cfg.AutoStartup)
}

function Update-ActionComboBoxItems {
    $sleepOk = $Win32Api::IsPwrSuspendAllowed()
    $hiberOk = $Win32Api::IsPwrHibernateAllowed()

    $sleepText = if ($sleepOk) { "睡眠 (Sleep)" } else { "睡眠 (Sleep) [系統已禁用]" }
    $hiberText = if ($hiberOk) { "休眠 (Hibernate)" } else { "休眠 (Hibernate) [系統已禁用]" }

    if ($cmbAction.Items[2] -ne $sleepText) { $cmbAction.Items[2] = $sleepText }
    if ($cmbAction.Items[3] -ne $hiberText) { $cmbAction.Items[3] = $hiberText }

    $sStr = if ($sleepOk) { "睡眠:可用" } else { "睡眠:已禁用" }
    $hStr = if ($hiberOk) { "休眠:可用" } else { "休眠:已禁用" }
    $lblPwrCaps.Text = "($sStr / $hStr)"
}

function Resolve-EffectivePowerAction([int]$requestedType, [bool]$allowFallback, [ref]$resolvedTypeOut, [ref]$actNameOut, [ref]$noteOut, [ref]$errReasonOut) {
    Update-ActionComboBoxItems
    $resolvedTypeOut.Value = $requestedType
    $noteOut.Value = ""
    $errReasonOut.Value = ""

    switch ($requestedType) {
        0 { $actNameOut.Value = "關機"; return $true }
        1 { $actNameOut.Value = "重新啟動"; return $true }
        2 {
            if ($Win32Api::IsPwrSuspendAllowed()) {
                $actNameOut.Value = "睡眠"
                return $true
            }
            if ($allowFallback) {
                $resolvedTypeOut.Value = 0
                $actNameOut.Value = "關機"
                $noteOut.Value = "偵測到系統已禁用【睡眠】，已依防呆設定自動降級為【關機】。"
                return $true
            }
            $actNameOut.Value = "睡眠"
            $errReasonOut.Value = "系統目前未支援或已禁用【睡眠 (Sleep)】功能！"
            return $false
        }
        3 {
            if ($Win32Api::IsPwrHibernateAllowed()) {
                $actNameOut.Value = "休眠"
                return $true
            }
            if ($allowFallback) {
                $resolvedTypeOut.Value = 0
                $actNameOut.Value = "關機"
                $noteOut.Value = "偵測到系統已禁用【休眠】，已依防呆設定自動降級為【關機】。"
                return $true
            }
            $actNameOut.Value = "休眠"
            $errReasonOut.Value = "系統目前已禁用【休眠 (Hibernate)】功能 (例如已透過 powercfg /h off 關閉)！"
            return $false
        }
    }
    $actNameOut.Value = "關機"
    $resolvedTypeOut.Value = 0
    return $true
}

$cmbAction.Add_DropDown({ Update-ActionComboBoxItems })

function Show-MainWindowToFront {
    $form.Show()
    $form.WindowState = [System.Windows.Forms.FormWindowState]::Normal
    $form.TopMost = $true
    $form.Activate()
    $form.TopMost = $false
}

function Get-UIValuesToConfig {
    [void]$form.ValidateChildren()

    if ($rbModeA.Checked) { $script:cfg.Mode = "A" }
    elseif ($rbModeB.Checked) { $script:cfg.Mode = "B" }
    elseif ($rbModeC.Checked) { $script:cfg.Mode = "C" }
    elseif ($rbModeD.Checked) { $script:cfg.Mode = "D" }

    $script:cfg.SpecDate           = $dtpSpecDate.Value.ToString("yyyy-MM-dd")
    $script:cfg.SpecHour           = [int]$numSpecHour.Value
    $script:cfg.SpecMin            = [int]$numSpecMin.Value
    $script:cfg.CountHours         = [int]$numCountHour.Value
    $script:cfg.CountMins          = [int]$numCountMin.Value
    $script:cfg.DailyHour          = [int]$numDailyHour.Value
    $script:cfg.DailyMin           = [int]$numDailyMin.Value
    if (-not $rbModeD.Checked) {
        $script:cfg.DelayIfBusy    = $chkDelayIfBusy.Checked
    }
    $script:cfg.MaxDelayMins       = [int]$numMaxDelayMins.Value
    if ($rbModeA.Checked -or $rbModeB.Checked) {
        $script:cfg.EarlyIfIdle    = $chkEarlyIfIdle.Checked
    }
    $script:cfg.IdleMins           = [int]$numIdleMins.Value
    $script:cfg.CheckCPU           = $chkCPU.Checked
    $script:cfg.CPULimit           = [int]$numCPU.Value
    $script:cfg.CheckNet           = $chkNet.Checked
    $script:cfg.NetLimitVal        = [int]$numNet.Value
    $script:cfg.NetUnit            = $cmbNetUnit.SelectedItem.ToString()
    $script:cfg.CheckPowerReq      = $chkPowerReq.Checked
    $script:cfg.ActionType         = $cmbAction.SelectedIndex
    $script:cfg.PreNotifySecs      = [int]$numNotifySecs.Value
    $script:cfg.FallbackToShutdown = $chkFallbackShutdown.Checked
    $script:cfg.ForceBlockedAct    = $chkForceBlocked.Checked

    if (-not $rbModeC.Checked) {
        $script:cfg.AutoStartup = $chkAutoStartup.Checked
    }
}

function Apply-ConfigToUI {
    $script:state.IsUpdatingUI = $true
    try {
        Update-ActionComboBoxItems
        switch ($script:cfg.Mode) {
            "A" { $rbModeA.Checked = $true }
            "B" { $rbModeB.Checked = $true }
            "C" { $rbModeC.Checked = $true }
            "D" { $rbModeD.Checked = $true }
            default { $rbModeB.Checked = $true }
        }
        try { $dtpSpecDate.Value = [DateTime]::ParseExact($script:cfg.SpecDate, "yyyy-MM-dd", $null) } catch { $dtpSpecDate.Value = [DateTime]::Now }
        $numSpecHour.Value           = [Math]::Max(0, [Math]::Min(23, $script:cfg.SpecHour))
        $numSpecMin.Value            = [Math]::Max(0, [Math]::Min(59, $script:cfg.SpecMin))
        $numCountHour.Value          = [Math]::Max(0, [Math]::Min(999, $script:cfg.CountHours))
        $numCountMin.Value           = [Math]::Max(0, [Math]::Min(59, $script:cfg.CountMins))
        $numDailyHour.Value          = [Math]::Max(0, [Math]::Min(23, $script:cfg.DailyHour))
        $numDailyMin.Value           = [Math]::Max(0, [Math]::Min(59, $script:cfg.DailyMin))
        $chkDelayIfBusy.Checked      = $script:cfg.DelayIfBusy
        $numMaxDelayMins.Value       = [Math]::Max(0, [Math]::Min(1440, $script:cfg.MaxDelayMins))
        $chkEarlyIfIdle.Checked      = $script:cfg.EarlyIfIdle
        $numIdleMins.Value           = [Math]::Max(1, [Math]::Min(1440, $script:cfg.IdleMins))
        $chkCPU.Checked              = $script:cfg.CheckCPU
        $numCPU.Value                = [Math]::Max(1, [Math]::Min(100, $script:cfg.CPULimit))
        $chkNet.Checked              = $script:cfg.CheckNet
        $cmbNetUnit.SelectedIndex    = if ($script:cfg.NetUnit -eq "MB/s") { 1 } else { 0 }
        $numNet.Value                = [Math]::Max(1, [Math]::Min(9999, $script:cfg.NetLimitVal))
        $chkPowerReq.Checked         = $script:cfg.CheckPowerReq
        $cmbAction.SelectedIndex     = [Math]::Max(0, [Math]::Min(3, $script:cfg.ActionType))
        $numNotifySecs.Value         = [Math]::Max(15, [Math]::Min(600, $script:cfg.PreNotifySecs))
        $chkFallbackShutdown.Checked = $script:cfg.FallbackToShutdown
        $chkForceBlocked.Checked     = $script:cfg.ForceBlockedAct
        $chkAutoStartup.Checked      = ($script:cfg.Mode -eq "C") -or $script:cfg.AutoStartup
    } finally {
        $script:state.IsUpdatingUI = $false
    }
    Update-ModeUIState
}

function Update-ModeUIState {
    $isTaskActive = ($script:state.EngineState -ne "Idle")
    $wasUpdating = $script:state.IsUpdatingUI
    $script:state.IsUpdatingUI = $true
    try {
        if ($rbModeC.Checked) {
            $chkAutoStartup.Checked = $true
            $chkAutoStartup.Enabled = $false
        } else {
            if (-not $isTaskActive) {
                $chkAutoStartup.Enabled = $true
                $chkAutoStartup.Checked = $script:cfg.AutoStartup
            }
        }

        if ($rbModeD.Checked) {
            $chkDelayIfBusy.Checked  = $true
            $chkDelayIfBusy.Enabled  = $false
            $numMaxDelayMins.Enabled = $false
            $chkEarlyIfIdle.Checked  = $false
            $chkEarlyIfIdle.Enabled  = $false
        } elseif ($rbModeC.Checked) {
            if (-not $isTaskActive) {
                $chkDelayIfBusy.Checked  = $script:cfg.DelayIfBusy
                $chkDelayIfBusy.Enabled  = $true
                $numMaxDelayMins.Enabled = $chkDelayIfBusy.Checked
            }
            $chkEarlyIfIdle.Checked = $false
            $chkEarlyIfIdle.Enabled = $false
        } else {
            if (-not $isTaskActive) {
                $chkDelayIfBusy.Checked  = $script:cfg.DelayIfBusy
                $chkDelayIfBusy.Enabled  = $true
                $numMaxDelayMins.Enabled = $chkDelayIfBusy.Checked
                $chkEarlyIfIdle.Checked  = $script:cfg.EarlyIfIdle
                $chkEarlyIfIdle.Enabled  = $true
            }
        }

        if ($rbModeD.Checked -or $chkDelayIfBusy.Checked) {
            $lblNotM.Text = "秒 (動滑鼠自動暫緩本次)"
        } else {
            $lblNotM.Text = "秒 (嚴格模式需按按鈕取消)"
        }

        if (-not $isTaskActive -and (Test-Path $iniPath)) {
            Sync-StartupShortcut (Get-EffectiveAutoStartup)
        }
    } finally {
        $script:state.IsUpdatingUI = $wasUpdating
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
    $grpMode.Enabled             = (-not $locked)
    $grpIdle.Enabled             = (-not $locked)
    $cmbAction.Enabled           = (-not $locked)
    $numNotifySecs.Enabled       = (-not $locked)
    $chkFallbackShutdown.Enabled = (-not $locked)
    $chkForceBlocked.Enabled     = (-not $locked)
    $chkAutoStartup.Enabled      = (-not $locked) -and (-not $rbModeC.Checked)

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

    $miCancel.Enabled = $locked
}

function Format-TimeSpan([TimeSpan]$ts) {
    if ($ts.TotalSeconds -lt 0) { return "00:00:00" }
    $totalHours = [int][Math]::Floor($ts.TotalHours)
    return ("{0:D2}:{1:D2}:{2:D2}" -f $totalHours, $ts.Minutes, $ts.Seconds)
}

function Enter-AlertState([string]$reason, [int]$seconds, [string]$actName, [string]$fallbackNote) {
    $now = [DateTime]::Now
    $script:state.EngineState           = "Alerting"
    $script:state.AlertTriggerReason    = $reason
    $script:state.AlertStartTime        = $now
    $script:state.AlertRemainingSeconds = [Math]::Max(1, $seconds)
    $script:state.AlertEndTime          = $now.AddSeconds($script:state.AlertRemainingSeconds)
    $script:state.AlertSnoozed          = $false

    # 參照已被 WinForms DPI 自動縮放後的控制項邊界定位，確保不同 DPI 與多次彈窗皆精準對齊
    if ($reason -ne "Smart") {
        $btnAlertHide.Visible  = $true
        $gap                   = $btnAlertHide.Left
        $halfW                 = [int](($lblAlertMsg.Width - $gap) / 2)
        $btnAlertHide.Width    = $halfW
        $btnAlertCancel.Left   = $btnAlertHide.Right + $gap
        $btnAlertCancel.Top    = $btnAlertHide.Top
        $btnAlertCancel.Height = $btnAlertHide.Height
        $btnAlertCancel.Width  = $lblAlertMsg.Right - $btnAlertCancel.Left
        $btnAlertCancel.Text   = "立即取消任務"
    } else {
        $btnAlertHide.Visible  = $false
        $btnAlertCancel.Left   = $btnAlertHide.Left
        $btnAlertCancel.Top    = $btnAlertHide.Top
        $btnAlertCancel.Height = $btnAlertHide.Height
        $btnAlertCancel.Width  = $lblAlertMsg.Right - $btnAlertHide.Left
        $btnAlertCancel.Text   = "■ 緊急中止整筆排程（徹底取消任務）"
    }

    Render-AlertStateUI $actName $fallbackNote
}

# --- 9. 核心引擎單步更新 (嚴格四狀態分派) ---
function Update-EngineTick([bool]$isInitialSync = $false) {
    $now = [DateTime]::Now

    if (-not $isInitialSync) {
        if ($null -ne $script:wakeEvent -and $script:wakeEvent.WaitOne(0)) {
            Update-ActionComboBoxItems
            Show-MainWindowToFront
        }

        # 偵測系統睡眠/休眠剛喚醒 (Tick 間隔大於 60 秒，兼顧現代 SSD 卡頓容錯與喚醒保護)
        $tickGap = ($now - $script:state.LastTickTime).TotalSeconds
        $script:state.LastTickTime = $now

        if ($tickGap -gt 60) {
            $script:state.IdleBucketScore = 0
            $script:state.LastUserIdleSec = 0
            if ($script:state.EngineState -eq "Alerting") {
                $script:state.EngineState  = "Monitoring"
                $script:state.AlertSnoozed = $false
                $alertForm.Hide()
            }
            if ($script:state.EngineState -ne "Idle") {
                if ($script:cfg.Mode -eq "C") {
                    if ($now -gt $script:state.TargetTime) {
                        $script:state.TargetTime = Calculate-PreviewTargetTime
                        $script:cfg.TargetTimestamp = $script:state.TargetTime.ToString("yyyy-MM-dd HH:mm:ss")
                        Save-IniConfig $script:cfg
                    }
                    $script:state.EngineState    = "WakeGuard"
                    $script:state.WakeGuardUntil = $now.AddSeconds(60)
                } elseif ($script:cfg.Mode -eq "D") {
                    $script:state.EngineState    = "WakeGuard"
                    $script:state.WakeGuardUntil = $now.AddSeconds(60)
                } else {
                    # 模式 A 或 B：若睡眠期間已過原定目標時間，直接取消過期任務防連環觸發
                    if ($now -gt $script:state.TargetTime) {
                        Stop-ShutdownTask
                        Set-SingleStatus "○ 待命中 (系統喚醒，原排程時間已過已自動取消)" $colorLightAmber
                        Set-TrayText "智慧自動關機助手 v1.6.6 - 待命中 (排程已過期)"
                        return
                    } else {
                        $script:state.EngineState    = "WakeGuard"
                        $script:state.WakeGuardUntil = $now.AddSeconds(60)
                    }
                }
            }
        }
    } else {
        $script:state.LastTickTime = $now
    }

    $lblSysTime.Text = "現在系統時間： " + $now.ToString("yyyy-MM-dd  HH:mm:ss")

    # 讀取即時硬體與電源請求狀態
    $userIdleSec = Get-UserIdleSeconds
    $hw          = Get-HardwareMetrics
    $pwrFlags    = Get-ActivePowerExecutionFlags
    $pwrLocked   = ($pwrFlags -gt 0)

    $idleMinPart = [int][Math]::Floor($userIdleSec / 60.0)
    $idleSecPart = $userIdleSec % 60
    $targetScore = ([int]$numIdleMins.Value) * 60

    $lblLiveCPU.Text = ("%      (目前即時 CPU：{0}%)" -f $hw.CPU)
    $liveNetStr = if ($hw.NetKB -ge 1024) { "{0:F1} MB/s" -f ($hw.NetKB / 1024.0) } else { "{0} KB/s" -f $hw.NetKB }
    $lblLiveNet.Text = "(目前即時流量：$liveNetStr)"

    if ($pwrLocked) {
        $lblLivePwrReq.ForeColor = [System.Drawing.Color]::FromArgb(200, 90, 0)
        $lblLivePwrReq.Text = "(目前：偵測到防休眠請求)"
    } else {
        $lblLivePwrReq.ForeColor = [System.Drawing.Color]::DimGray
        $lblLivePwrReq.Text = "(目前：無電源鎖定)"
    }

    # --- 更新【漏斗積分池】(結合單調遞減比對，防止 Timer 輕微抖動漏判短暫點擊) ---
    $netLimitInKB = if ($cmbNetUnit.SelectedItem -eq "MB/s") { ([int]$numNet.Value) * 1024 } else { [int]$numNet.Value }
    $cpuOk = (-not $chkCPU.Checked) -or ($hw.CPU -le [int]$numCPU.Value)
    $netOk = (-not $chkNet.Checked) -or ($hw.NetKB -le $netLimitInKB)
    $pwrOk = (-not $chkPowerReq.Checked) -or (-not $pwrLocked)

    $hasInputSinceLastTick = ($userIdleSec -lt 2) -or ($userIdleSec -lt $script:state.LastUserIdleSec)
    $script:state.LastUserIdleSec = $userIdleSec

    if (-not $isInitialSync) {
        if ($script:state.EngineState -eq "WakeGuard" -or $hasInputSinceLastTick) {
            $script:state.IdleBucketScore = 0
        } elseif ($cpuOk -and $netOk -and $pwrOk) {
            $script:state.IdleBucketScore = [Math]::Min($targetScore, $script:state.IdleBucketScore + 1)
        } else {
            $script:state.IdleBucketScore = [Math]::Max(0, $script:state.IdleBucketScore - 5)
        }
    }

    $lblLiveIdle.Text = ("分鐘 (積分: {0}/{1} | 鍵鼠無動作: {2}分{3:D2}秒)" -f $script:state.IdleBucketScore, $targetScore, $idleMinPart, $idleSecPart)

    # 【狀態 1：Idle 待命中】
    if ($script:state.EngineState -eq "Idle") {
        if ($rbModeD.Checked) {
            $lblTargetTime.Text = ("目標執行時間： 綠燈二積分滿 {0} 分 ({1} 分鐘) 後觸發" -f $targetScore, [int]$numIdleMins.Value)
        } else {
            $prev = Calculate-PreviewTargetTime
            $rem = $prev - $now
            if ($rbModeA.Checked -and $rem.TotalSeconds -le 0) {
                $lblTargetTime.Text = ("目標執行時間： {0}  (設定時間已過，請調整)" -f $prev.ToString("yyyy-MM-dd HH:mm:ss"))
            } else {
                $lblTargetTime.Text = ("目標執行時間： {0}  (預覽剩餘 {1})" -f $prev.ToString("yyyy-MM-dd HH:mm:ss"), (Format-TimeSpan $rem))
            }
        }
        return
    }

    # 解析目前生效的電源動作名稱
    $resolvedType = 0
    $actName      = ""
    $fallbackNote = ""
    $errReason    = ""
    [void](Resolve-EffectivePowerAction $script:cfg.ActionType $script:cfg.FallbackToShutdown ([ref]$resolvedType) ([ref]$actName) ([ref]$fallbackNote) ([ref]$errReason))

    $notifyBufferSec = [int]$numNotifySecs.Value

    # 【狀態 2：WakeGuard 系統剛喚醒緩衝】
    if ($script:state.EngineState -eq "WakeGuard") {
        if ($now -ge $script:state.WakeGuardUntil) {
            $script:state.EngineState = "Monitoring"
        } else {
            $wgSpan = $script:state.WakeGuardUntil - $now
            $wgStr  = Format-TimeSpan $wgSpan
            $lblTargetTime.Text = ("目標執行時間： 系統剛喚醒緩衝中 (將於 {0} 後恢復雙綠燈監測)" -f $wgStr)
            Set-SingleStatus "● 系統剛喚醒安全緩衝中 (倒數 $wgStr)" $colorLightAmber
            Set-TrayText "喚醒安全緩衝中 ($wgStr)"
            return
        }
    }

    # 【狀態 3：Alerting 強制最後防誤殺確認視窗倒數】
    if ($script:state.EngineState -eq "Alerting") {
        if ($script:state.AlertTriggerReason -eq "Smart") {
            $minHoldScore    = [int][Math]::Floor($targetScore * 0.9)
            $alertElapsedSec = ($now - $script:state.AlertStartTime).TotalSeconds
            $hasNewUserInput = $hasInputSinceLastTick -or ($userIdleSec -le $alertElapsedSec)
            if ($hasNewUserInput -or $script:state.IdleBucketScore -lt $minHoldScore) {
                if ($hasNewUserInput) {
                    $script:state.IdleBucketScore = 0
                }
                $script:state.EngineState  = "Monitoring"
                $script:state.AlertSnoozed = $false
                $alertForm.Hide()
                return
            }
        }

        Render-AlertStateUI $actName $fallbackNote

        if ($script:state.AlertRemainingSeconds -le 0) {
            Execute-FinalSystemAction
        }
        return
    }

    # 【狀態 4：Monitoring 任務監測中】
    # 分支 4-A：嚴格準時模式 (未勾選 DelayIfBusy 且非 Mode D)
    if ($script:cfg.Mode -ne "D" -and (-not $script:cfg.DelayIfBusy)) {
        $remTime = $script:state.TargetTime - $now
        $canEarlyTrigger = (($script:cfg.Mode -eq "A" -or $script:cfg.Mode -eq "B") -and $script:cfg.EarlyIfIdle)

        if ($canEarlyTrigger -and ($script:state.IdleBucketScore -ge $targetScore)) {
            $smartSecs = [Math]::Min($notifyBufferSec, [Math]::Max(1, [int][Math]::Ceiling($remTime.TotalSeconds)))
            Enter-AlertState "Smart" $smartSecs $actName $fallbackNote
            return
        }

        if ($remTime.TotalSeconds -le $notifyBufferSec) {
            $secs = [Math]::Max(1, [int][Math]::Ceiling($remTime.TotalSeconds))
            Enter-AlertState "StrictTime" $secs $actName $fallbackNote
            return
        }

        $remStr = Format-TimeSpan $remTime
        $lblTargetTime.Text = ("目標執行時間： {0}  (倒數剩餘 {1})" -f $script:state.TargetTime.ToString("yyyy-MM-dd HH:mm:ss"), $remStr)
        if ($canEarlyTrigger) {
            Set-DualLightStatus "● 嚴格準時倒數中" $colorLightGreen "● 提早積分($($script:state.IdleBucketScore)/$targetScore)" $colorLightAmber
        } else {
            Set-SingleStatus "● 嚴格準時倒數中 (已關閉忙碌延後保護)" $colorLightGreen
        }
        Set-TrayText "倒數剩餘：$remStr ($actName)"
        return
    }

    # 分支 4-B：雙綠燈智慧模式 (Mode D 或 勾選 DelayIfBusy 的 A/B/C)
    # 綠燈一：排程意圖 ($intentReady)
    $intentReady   = $false
    $intentSubText = ""
    if ($script:cfg.Mode -eq "D") {
        $intentReady   = $true
        $intentSubText = "純閒置常亮"
        $lblTargetTime.Text = ("目標執行時間： 綠燈二安全積分累積滿 {0} 分 ({1} 分鐘) 後觸發" -f $targetScore, $script:cfg.IdleMins)
    } else {
        $remTime = $script:state.TargetTime - $now
        if ($remTime.TotalSeconds -le 0) {
            $intentReady   = $true
            $intentSubText = "時間已到"
            $overdueMins   = [int][Math]::Floor(($now - $script:state.TargetTime).TotalMinutes)
            $lblTargetTime.Text = ("目標執行時間： {0}  (已逾時 {1} 分，等待綠燈二安全積分)" -f $script:state.TargetTime.ToString("yyyy-MM-dd HH:mm:ss"), $overdueMins)
        } else {
            $remStr = Format-TimeSpan $remTime
            $lblTargetTime.Text = ("目標執行時間： {0}  (倒數剩餘 {1})" -f $script:state.TargetTime.ToString("yyyy-MM-dd HH:mm:ss"), $remStr)
            if (($script:cfg.Mode -eq "A" -or $script:cfg.Mode -eq "B") -and $script:cfg.EarlyIfIdle) {
                $intentReady   = $true
                $intentSubText = "提早觸發就緒"
            } else {
                $intentReady   = $false
                $intentSubText = "倒數中 $remStr"
            }
        }
    }

    # 綠燈二：安全可關 ($systemReady)
    $systemReady    = ($script:state.IdleBucketScore -ge $targetScore)
    $maxDelayForced = $false
    if ($script:cfg.Mode -ne "D" -and $script:cfg.MaxDelayMins -gt 0) {
        $overdueTotalMins = ($now - $script:state.TargetTime).TotalMinutes
        if ($overdueTotalMins -ge $script:cfg.MaxDelayMins) {
            $systemReady    = $true
            $maxDelayForced = $true
        }
    }

    if ($intentReady -and $systemReady) {
        $reason = if ($maxDelayForced) { "ForcedMaxDelay" } else { "Smart" }
        Enter-AlertState $reason $notifyBufferSec $actName $fallbackNote
        return
    }

    $g1Text  = if ($intentReady) { "● 意圖就緒($intentSubText)" } else { "● 意圖等待($intentSubText)" }
    $g1Color = if ($intentReady) { $colorLightGreen } else { $colorLightAmber }

    $g2Text  = if ($systemReady) { "● 安全滿分($($script:state.IdleBucketScore)/$targetScore)" } else { "● 積分累積($($script:state.IdleBucketScore)/$targetScore)" }
    $g2Color = if ($systemReady) { $colorLightGreen } else { $colorLightAmber }

    Set-DualLightStatus $g1Text $g1Color $g2Text $g2Color
    Set-TrayText "雙綠燈監測：積分 $($script:state.IdleBucketScore)/$targetScore ($actName)"
}

# --- 10. 任務生命週期控制 (Start / Stop / Execute) ---
function Start-ShutdownTask([bool]$isResuming = $false) {
    Get-UIValuesToConfig

    $resolvedType = 0
    $actShortName = ""
    $fallbackNote = ""
    $errReason    = ""
    if (-not (Resolve-EffectivePowerAction $script:cfg.ActionType $script:cfg.FallbackToShutdown ([ref]$resolvedType) ([ref]$actShortName) ([ref]$fallbackNote) ([ref]$errReason))) {
        if ($isResuming) {
            $script:state.EngineState = "Idle"
            $script:cfg.IsRunning = $false
            $script:cfg.TargetTimestamp = ""
            Save-IniConfig $script:cfg
            Set-ControlsLocked $false
            Update-ModeUIState
            $script:state.ForceShowOnStartup = $true
            Set-SingleStatus "● 上次排定的【$actShortName】因系統已禁用而無法恢復，請重新設定！" $colorLightRed
            Set-TrayText "智慧自動關機助手 - 【$actShortName】已禁用請重新設定"
            return
        } else {
            [System.Windows.Forms.MessageBox]::Show(
                "$errReason`n`n請勾選「禁用防呆：自動降級為【關機】」，或在下拉選單改選其他可用動作。",
                "系統電源動作已禁用",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Warning
            ) | Out-Null
            return
        }
    }

    if (-not $isResuming) {
        $script:cfg.LastTriggeredDate = ""

        if ($script:cfg.Mode -eq "D") {
            $script:state.TargetTime = [DateTime]::MaxValue
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
            # 嚴格準時模式下，若距離目標時間的總秒數小於等於最後確認秒數，給予明確提示並於確認後重新校準時間
            if (-not $script:cfg.DelayIfBusy) {
                $totalSecs = if ($script:cfg.Mode -eq "B") {
                    ($script:cfg.CountHours * 3600) + ($script:cfg.CountMins * 60)
                } else {
                    [int][Math]::Ceiling(($calc - [DateTime]::Now).TotalSeconds)
                }
                if ($totalSecs -gt 0 -and $totalSecs -le $script:cfg.PreNotifySecs) {
                    $confirmMsg = "距離目標時間僅剩約 ${totalSecs} 秒（小於或等於「最後防誤殺確認倒數 $($script:cfg.PreNotifySecs) 秒」），啟動後將直接進入最後確認視窗。`n`n確定要立即啟動嗎？"
                    $res = [System.Windows.Forms.MessageBox]::Show($confirmMsg, "短時間倒數確認", [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Information)
                    if ($res -ne [System.Windows.Forms.DialogResult]::Yes) { return }

                    if ($script:cfg.Mode -eq "A") {
                        if ($calc -le [DateTime]::Now) {
                            [System.Windows.Forms.MessageBox]::Show("在確認期間，指定的日期與時間已經過去，請重新設定未來時間！", "時間已過期", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
                            return
                        }
                    } else {
                        # 模式 B 從按下確認這一刻起算完整倒數；模式 C 若已過今日時間則自動順延至明日
                        $calc = Calculate-PreviewTargetTime
                    }
                }
            }
            $script:state.TargetTime = $calc
            $script:cfg.TargetTimestamp = $script:state.TargetTime.ToString("yyyy-MM-dd HH:mm:ss")
        }
    }

    Reset-TransientRuntimeState
    $script:state.EngineState = "Monitoring"
    $script:cfg.IsRunning     = $true
    $alertForm.Hide()

    Sync-StartupShortcut (Get-EffectiveAutoStartup)
    Save-IniConfig $script:cfg
    Set-ControlsLocked $true
    Update-EngineTick $true
}

function Stop-ShutdownTask {
    Reset-TransientRuntimeState
    $script:state.EngineState     = "Idle"
    $script:cfg.IsRunning         = $false
    $script:cfg.TargetTimestamp   = ""
    $script:cfg.LastTriggeredDate = ""
    $alertForm.Hide()

    if (Test-Path $iniPath) {
        Save-IniConfig $script:cfg
    }
    Set-ControlsLocked $false
    Update-ModeUIState
    Update-ActionComboBoxItems
    Set-SingleStatus "○ 待命中 (任務已取消 / 停止)" $colorLightGreen
    Set-TrayText "智慧自動關機助手 v1.6.6 - 待命中"
}

function Execute-FinalSystemAction {
    $now = [DateTime]::Now
    Reset-TransientRuntimeState
    $alertForm.Hide()

    $effectiveType = 0
    $actShortName  = ""
    $fallbackNote  = ""
    $errReason     = ""
    if (-not (Resolve-EffectivePowerAction $script:cfg.ActionType $script:cfg.FallbackToShutdown ([ref]$effectiveType) ([ref]$actShortName) ([ref]$fallbackNote) ([ref]$errReason))) {
        Stop-ShutdownTask
        Set-SingleStatus "● 執行中止：系統已禁用【$actShortName】且未開啟自動降級！" $colorLightRed
        Set-TrayText "智慧自動關機助手 - 【$actShortName】已禁用而中止"
        Show-MainWindowToFront
        return
    }

    # 執行實體電源指令前先完成狀態收尾（避免阻塞式睡眠喚醒時產生狀態競態）
    if ($script:cfg.Mode -eq "C") {
        $triggeredDateStr = if ($script:state.TargetTime -ne [DateTime]::MaxValue) { $script:state.TargetTime.ToString("yyyy-MM-dd") } else { $now.ToString("yyyy-MM-dd") }
        $script:cfg.LastTriggeredDate = $triggeredDateStr

        $todayTarget = $now.Date.AddHours($script:cfg.DailyHour).AddMinutes($script:cfg.DailyMin)
        $nextTarget  = if ($now -lt $todayTarget -and $script:cfg.LastTriggeredDate -ne $now.ToString("yyyy-MM-dd")) {
            $todayTarget
        } else {
            $todayTarget.AddDays(1)
        }
        # 12 小時最小間隔冷卻：防止跨日極端延後（接近 24 小時）時在短時間內連環觸發兩次，同時保留睡前跨午夜排程
        if (($nextTarget - $now).TotalHours -lt 12) {
            $nextTarget = $nextTarget.AddDays(1)
        }
        $script:state.TargetTime    = $nextTarget
        $script:cfg.TargetTimestamp = $nextTarget.ToString("yyyy-MM-dd HH:mm:ss")
        $script:cfg.IsRunning       = $true
        Save-IniConfig $script:cfg

        if ($effectiveType -eq 2 -or $effectiveType -eq 3) {
            $script:state.EngineState    = "WakeGuard"
            $script:state.WakeGuardUntil = $now.AddSeconds(60)
        } else {
            $script:state.EngineState = "Monitoring"
        }
        Set-SingleStatus "● 每日排程已執行，繼續背景待命明日排程" $colorLightGreen
        Set-TrayText "智慧自動關機助手 - 每日排程待命中"
    } else {
        $script:cfg.LastTriggeredDate = $now.ToString("yyyy-MM-dd")
        Stop-ShutdownTask
    }

    $forceFlag = if ($script:cfg.ForceBlockedAct) { " /f" } else { "" }
    $pwrOk = $true
    switch ($effectiveType) {
        0 {
            try {
                Start-Process "shutdown.exe" -ArgumentList "/s$forceFlag /t 0" -WindowStyle Hidden -ErrorAction Stop
            } catch {
                if ($script:cfg.Mode -eq "C") { Stop-ShutdownTask }
                Set-SingleStatus "● 執行【關機】指令失敗（可能受系統原則或安全軟體阻擋）" $colorLightRed
                Set-TrayText "智慧自動關機助手 - 關機指令執行失敗"
                Show-MainWindowToFront
                return
            }
        }
        1 {
            try {
                Start-Process "shutdown.exe" -ArgumentList "/r$forceFlag /t 0" -WindowStyle Hidden -ErrorAction Stop
            } catch {
                if ($script:cfg.Mode -eq "C") { Stop-ShutdownTask }
                Set-SingleStatus "● 執行【重新啟動】指令失敗（可能受系統原則或安全軟體阻擋）" $colorLightRed
                Set-TrayText "智慧自動關機助手 - 重啟指令執行失敗"
                Show-MainWindowToFront
                return
            }
        }
        2 {
            $pwrOk = $Win32Api::SetSuspendState($false, $false, $false)
            $wakeNow = [DateTime]::Now
            $script:state.LastTickTime = $wakeNow
            if ($pwrOk -and $script:cfg.Mode -eq "C") {
                $script:state.WakeGuardUntil = $wakeNow.AddSeconds(60)
            }
        }
        3 {
            $pwrOk = $Win32Api::SetSuspendState($true, $false, $false)
            $wakeNow = [DateTime]::Now
            $script:state.LastTickTime = $wakeNow
            if ($pwrOk -and $script:cfg.Mode -eq "C") {
                $script:state.WakeGuardUntil = $wakeNow.AddSeconds(60)
            }
        }
    }

    if (-not $pwrOk) {
        $failActName = if ($effectiveType -eq 2) { "睡眠" } else { "休眠" }
        if ($script:cfg.FallbackToShutdown) {
            Start-Process "shutdown.exe" -ArgumentList "/s$forceFlag /t 0" -WindowStyle Hidden
            Set-SingleStatus "● 【$failActName】執行遭拒，已自動降級執行【關機】！" $colorLightAmber
            Set-TrayText "【$failActName】遭拒，已降級執行關機"
        } else {
            if ($script:cfg.Mode -eq "C") {
                Stop-ShutdownTask
            }
            Set-SingleStatus "● 系統拒絕進入【$failActName】（可能受驅動程式或電源原則阻擋）" $colorLightRed
            Set-TrayText "智慧自動關機助手 - 【$failActName】執行失敗"
            Show-MainWindowToFront
        }
    } elseif ($effectiveType -eq 2 -or $effectiveType -eq 3) {
        if ($script:cfg.Mode -ne "C") {
            $okActName = if ($effectiveType -eq 2) { "睡眠" } else { "休眠" }
            Set-SingleStatus "○ 待命中 (上次排程【$okActName】已執行完畢)" $colorLightGreen
            Set-TrayText "智慧自動關機助手 v1.6.6 - 待命中"
        }
    }
}

# --- 11. 綁定介面控制項事件 ---
$rbModeA.Add_CheckedChanged({ if ($rbModeA.Checked) { Update-ModeUIState } })
$rbModeB.Add_CheckedChanged({ if ($rbModeB.Checked) { Update-ModeUIState } })
$rbModeC.Add_CheckedChanged({ if ($rbModeC.Checked) { Update-ModeUIState } })
$rbModeD.Add_CheckedChanged({ if ($rbModeD.Checked) { Update-ModeUIState } })

$chkDelayIfBusy.Add_CheckedChanged({
    if (-not $script:state.IsUpdatingUI -and ($script:state.EngineState -eq "Idle")) {
        if (-not $rbModeD.Checked) {
            $script:cfg.DelayIfBusy = $chkDelayIfBusy.Checked
        }
        Update-ModeUIState
    }
})

$chkEarlyIfIdle.Add_CheckedChanged({
    if (-not $script:state.IsUpdatingUI -and ($script:state.EngineState -eq "Idle")) {
        if ($rbModeA.Checked -or $rbModeB.Checked) {
            $script:cfg.EarlyIfIdle = $chkEarlyIfIdle.Checked
        }
    }
})

$chkAutoStartup.Add_CheckedChanged({
    if (-not $script:state.IsUpdatingUI -and ($script:state.EngineState -eq "Idle") -and (-not $rbModeC.Checked)) {
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
        if (Test-Path $appDataDir) { try { Remove-Item $appDataDir -Recurse -Force } catch {} }
        $script:state.AllowExit = $true
        $notifyIcon.Visible = $false
        $form.Close()
    }
})

$btnAlertHide.Add_Click({
    $alertForm.Hide()
    $script:state.AlertSnoozed = $true
})

$btnAlertCancel.Add_Click({ Stop-ShutdownTask })

$notifyIcon.Add_DoubleClick({ Show-MainWindowToFront })
$miShow.Add_Click({ Show-MainWindowToFront })
$miCancel.Add_Click({
    if ($script:state.EngineState -ne "Idle") { Stop-ShutdownTask }
})

$miExit.Add_Click({
    $script:cfg.IsRunning       = $false
    $script:cfg.TargetTimestamp = ""
    if ($script:cfg.Mode -eq "C" -and (-not $script:cfg.AutoStartup)) {
        Sync-StartupShortcut $false
    }
    if (Test-Path $iniPath) { Save-IniConfig $script:cfg }

    $script:state.AllowExit = $true
    $notifyIcon.Visible = $false
    $alertForm.Hide()
    $form.Close()
})

$form.Add_FormClosing({
    param($s, $e)
    if ($e.CloseReason -eq [System.Windows.Forms.CloseReason]::WindowsShutDown -or
        $e.CloseReason -eq [System.Windows.Forms.CloseReason]::TaskManagerClosing) {
        $script:state.AllowExit = $true
    }
    if (-not $script:state.AllowExit) {
        $e.Cancel = $true
        $form.Hide()
    } else {
        $timer.Stop()
        if ($null -ne $alertForm) {
            try {
                $alertForm.Hide()
                $alertForm.Close()
                $alertForm.Dispose()
            } catch {}
        }
        $notifyIcon.Visible = $false
        $notifyIcon.Dispose()
        if ($null -ne $script:wakeEvent) {
            try { $script:wakeEvent.Close() } catch {}
        }
    }
})

# --- 12. 核心每秒定時器 (1000ms) ---
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({ Update-EngineTick $false })

# --- 13. 啟動初始化與狀態恢復檢查 ---
Apply-ConfigToUI
if (Test-Path $iniPath) {
    Sync-StartupShortcut (Get-EffectiveAutoStartup)
}

if ($script:cfg.IsRunning) {
    if ($script:cfg.Mode -eq "D") {
        Start-ShutdownTask $true
    } elseif ($script:cfg.Mode -eq "C") {
        $savedTarget = [DateTime]::MinValue
        if ([DateTime]::TryParseExact($script:cfg.TargetTimestamp, "yyyy-MM-dd HH:mm:ss", $null, [System.Globalization.DateTimeStyles]::None, [ref]$savedTarget) -and ($savedTarget -gt [DateTime]::Now)) {
            $script:state.TargetTime = $savedTarget
        } else {
            $script:state.TargetTime = Calculate-PreviewTargetTime
            $script:cfg.TargetTimestamp = $script:state.TargetTime.ToString("yyyy-MM-dd HH:mm:ss")
        }
        Start-ShutdownTask $true
    } else {
        $savedTarget = [DateTime]::MinValue
        if ([DateTime]::TryParseExact($script:cfg.TargetTimestamp, "yyyy-MM-dd HH:mm:ss", $null, [System.Globalization.DateTimeStyles]::None, [ref]$savedTarget)) {
            if ($savedTarget -gt [DateTime]::Now) {
                $script:state.TargetTime = $savedTarget
                Start-ShutdownTask $true
            } else {
                $script:cfg.IsRunning       = $false
                $script:cfg.TargetTimestamp = ""
                Save-IniConfig $script:cfg
                Update-EngineTick $true
                Set-SingleStatus "○ 待命中 (上次排程時間已過，已自動取消任務)" $colorLightAmber
                Set-TrayText "智慧自動關機助手 v1.6.6 - 待命中 (上次排程已過期)"
            }
        } else {
            $script:cfg.IsRunning       = $false
            $script:cfg.TargetTimestamp = ""
            Save-IniConfig $script:cfg
            Update-EngineTick $true
        }
    }
} else {
    Update-EngineTick $true
}

$timer.Start()

if ($isSilentLaunch -and (-not $script:state.ForceShowOnStartup)) {
    $form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
    $form.ShowInTaskbar = $false
    $form.Add_Shown({ $form.Hide(); $form.ShowInTaskbar = $true })
}

[System.Windows.Forms.Application]::Run($form)
