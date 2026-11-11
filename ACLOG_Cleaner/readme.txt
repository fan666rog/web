這是一個清除華碩AC軟體產生的LOG日誌bat

由Gemini4 Argon編寫，我提供遇到的資料夾和規則給他
主要是清理這裡面C:\ProgramData\ASUS\ARMOURY CRATE Diagnosis的log
程式點擊執行時，會先進行提權，不然無法清理系統資料夾的檔案
會先掃描檔案，顯示給你看之後，經過你的同意，才會進行清理刪除

#### ✨ 工具特色與安全機制
1. **先檢查、後刪除（兩階段確認）：** 
   點開後**不會**馬上亂砍檔案！它會先掃描並列出「找到哪些舊檔、預計可釋放多少空間」，等你親眼確認清單、輸入 `Y` 並按下 Enter 後才會執行刪除。
2. **智慧保留「最新 3 個開機日」紀錄：**
   不是死板地用日曆天數計算。就算你出門好幾天沒開機，工具也會聰明地辨識檔名上的日期（如 `2026-11-11`），自動幫你保留**最近 3 次有開機紀錄當天**的所有 Log（含同日 `_00`、`_01` 分片），只清理更早之前的歷史舊檔。
3. **自動適配所有人的使用者帳號：**
   除了清理 `C:\ProgramData` 系統共用日誌外，也會自動偵測每個人電腦自己的使用者資料夾（`C:\Users\[你的帳號]\AppData\Local\...`），不需手動修改任何路徑即可通用。
4. **沒裝的功能自動略過、不報錯：**
   每個人的主機板與周邊不同，工具找不到該資料夾時會自動跳過；遇到系統正在寫入中的檔案也會安全略過，絕對不會卡死或跳紅字。
5. **純系統內建指令：**
   純 `.bat` 結合 Windows 內建 PowerShell 語法，免安裝任何第三方軟體，右鍵用「記事本」打開就能看到全部原始碼，乾淨透明。

---

#### 📂 目前支援清理的資料夾清單
* **1. 系統目錄 (`C:\ProgramData\ASUS\ARMOURY CRATE Diagnosis`)：**
  * **全部清空 `.log`：** `GameFirst`
  * **保留最新 3 個紀錄日：** `AacAIOFanSetup`、`AacKBSetup`、`AacMouseSetup`、`AcNodeAddon`、`AIOFanSDK`、`AppLog`、`KeyboardSDK`、`MouseSDK`、`UnifyScanner`
  * **指定前綴保留最新 3 個紀錄日：** `ROG Live Service`（僅清理 `ROGLiveService_*.log`）
* **2. 使用者個人目錄 (`C:\Users\[使用者名稱]\AppData\Local\ASUS\Armoury Crate Diagnosis\AppLog`)：**
  * **指定前綴保留最新 3 個紀錄日：** 僅針對 `ArmouryCrate.UserSessionHelper_*.log` 進行清理，不影響同資料夾其他檔案。

---

#### 🚀 使用方法
1. 下載檔案後，直接雙擊執行 **`AC日誌LOG清理工具.bat`**（若建立捷徑或自己存檔，請確保記事本存檔編碼為 `UTF-8`）。
2. 程式會自動申請系統管理員權限（因為 `C:\ProgramData` 需要管理員權限才能清理）。
3. 檢視畫面上的掃描清單，確認無誤後輸入 **`Y`** 並按 **`Enter`** 即可一鍵清理完畢！
