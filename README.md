# TW Core FHIR 交換測試系統

本專案為基於 HL7 FHIR R4 與台灣核心實作指引（TW Core IG）開發的資料交換測試系統，提供 FHIR Resource 建立、查詢、關聯及資料交換歷程檢視功能。

本系統為學習與測試用途，非正式醫療資訊系統。

## 一、技術架構

- 前端：Vue 3 + Vite
- 後端：Node.js + Express
- 資料交換格式：FHIR JSON
- FHIR 版本：R4（4.0.1）
- 測試伺服器：https://hapi.fhir.tw/fhir

## 二、主要功能

### 1. FHIR Server 連線測試
透過 CapabilityStatement（metadata）確認 FHIR Server 的連線狀態及版本資訊。

### 2. FHIR Resource 建立
支援建立以下三種 Resource：

- Organization（醫療機構）
- Practitioner（醫事人員）
- Patient（病人）

Patient 可透過 Reference 關聯既有 Organization 與 Practitioner。

### 3. FHIR Resource 查詢
- 依 Organization 查詢所管理的 Patient。
- 依 Patient Resource ID 讀取單筆資料。

### 4. 資料交換歷程
- 記錄 Resource 建立、查詢與讀取操作。
- 顯示操作時間、Resource 類型、Resource ID 及 HTTP Status。
- 查看 Request JSON 與 Response JSON。
- 支援依 Resource ID 搜尋。
- 最新交換紀錄優先顯示。

## 三、TW Core Profile

系統建立 Resource 時會宣告以下 Profile：

- Organization-hosp-twcore
- Practitioner-twcore
- Patient-twcore

注意：目前系統尚未整合完整的 TW Core Profile 自動驗證。宣告 Profile 不代表資料已通過所有 TW Core 規範檢查。

## 四、專案結構

```text
fhir-exchange-system/
├── client/              # Vue 3 前端
├── server/
│   ├── services/        # FHIR API 與交換紀錄服務
│   ├── test-data/       # FHIR JSON 測試範例
│   └── index.js         # Express API
├── .gitignore
└── README.md
```

## 五、執行方式

請先安裝 Node.js 與 npm。

### 啟動後端

```bash
cd server
npm install
node index.js
```

後端預設執行於：

`http://localhost:3000`

### 啟動前端

另外開啟一個終端機：

```bash
cd client
npm install
npm run dev
```

依照 Vite 終端機顯示的本機網址開啟瀏覽器。

## 六、測試流程

1. 確認 FHIR Server 連線成功。
2. 建立 Organization，記錄 Resource ID。
3. 建立 Practitioner，記錄 Resource ID。
4. 建立 Patient，選擇所屬 Organization 與 Practitioner。
5. 依 Organization 查詢 Patient。
6. 依 Patient ID 讀取資料。
7. 進入交換歷程，確認 HTTP Status 及 Request／Response JSON。

`server/test-data/` 提供 FHIR JSON 測試範例。若直接使用這些檔案進行測試，需先確認 Patient 的 Reference ID 與目標 FHIR Server 上實際存在的 Resource 一致。

## 七、目前限制

- 尚未整合完整的 TW Core Profile 自動驗證。
- 交換紀錄目前儲存在後端記憶體中，重新啟動後端會遺失紀錄。
- 目前僅支援 Organization、Practitioner、Patient 三種 Resource。
- 尚未提供正式環境所需的身分驗證、權限管理與敏感資料保護機制。

## 八、注意事項

本專案僅供教學與測試使用，請勿上傳真實病人個資或機密資料至公開測試伺服器。
