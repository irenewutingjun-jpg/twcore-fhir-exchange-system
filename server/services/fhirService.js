const axios = require("axios");

// TW Core FHIR Server 基本網址
const FHIR_BASE_URL = "https://hapi.fhir.tw/fhir";

// 建立共用 Axios 連線
const fhirClient = axios.create({
    baseURL: FHIR_BASE_URL,
    headers: {
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
    },
    timeout: 15000,
});

// 取得 FHIR Server Metadata
async function getMetadata() {
    const response = await fhirClient.get("/metadata");
    return response.data;
}

// 建立 FHIR Resource
async function createResource(resourceType, resourceData) {
    const response = await fhirClient.post(
        `/${resourceType}`,
        resourceData
    );

    return response;
}

// 依照 Resource ID 查詢資料
async function readResource(resourceType, id) {
    const response = await fhirClient.get(
        `/${resourceType}/${id}`
    );
    return response;
}

// 依條件搜尋 FHIR Resource
async function searchResource(resourceType, params = {}) {
    let response

    if (params._getpages) {  // HAPI FHIR 下一頁請求：使用 FHIR Server 根路徑
        response = await fhirClient.get("/", {
            params: params
        })
    } else {  // 一般搜尋請求：使用 Resource 類型路徑
        response = await fhirClient.get(`/${resourceType}`, {
            params: params
        })
    };
    return response
}

module.exports = {
    fhirClient,
    getMetadata,
    createResource,
    readResource,
    searchResource
};
