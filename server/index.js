const {
    getMetadata,
    createResource,
    readResource,
    searchResource,
} = require("./services/fhirService");

const {
    addExchangeLog,
    getExchangeLogs,
    clearExchangeLogs
} = require("./services/exchangeLog");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 允許的 Resource 類型
const allowedTypes = ["Organization", "Practitioner", "Patient"];

app.use(cors());
app.use(
    express.json({
        type: [
            "application/json",
            "application/fhir+json"
        ]
}));

// FHIR Server Metadata
app.get("/api/fhir/metadata", async (req, res) => {
    try {
        const metadata = await getMetadata();

        console.log("FHIR Server 連線成功");

        res.json({
            status: "success",
            message: "FHIR Server 連線成功",
            fhirVersion: metadata.fhirVersion,
            serverName: metadata.software?.name,
        });
    } catch (error) {
        console.error("FHIR Server 連線失敗：", error.message);

        res.status(500).json({
            status: "error",
            message: "FHIR Server 連線失敗",
            error: error.message,
        });
    }
});

// 取得所有 FHIR 交換紀錄
app.get("/api/fhir/logs", (req, res) => {
    res.json({
        status: "success",
        total: getExchangeLogs().length,
        data: getExchangeLogs()
    });
});

// 清空 FHIR 交換紀錄
app.delete("/api/fhir/logs", (req, res) => {
    clearExchangeLogs();

    res.json({
        status: "success",
        message: "FHIR 交換紀錄已清空"
    });
});

// 共用 Resource 建立 API
app.post("/api/fhir/:resourceType", async (req, res) => {
    const { resourceType } = req.params;

    try {
        const resourceData = req.body;
    
        if (!allowedTypes.includes(resourceType)) {
            return res.status(400).json({
                status: "error",
                message: "不支援的 Resource Type",
            });
        }
    
        if (!resourceData || resourceData.resourceType !== resourceType) {
            return res.status(400).json({
                status: "400",
                message: `Resource Type 必須是 ${resourceType}`,
            });
        }
    
        const response = await createResource(resourceType, resourceData);

        // 記錄 Resource 建立成功的交換歷程
        addExchangeLog({
            operation: "Create",
            resourceType: resourceType,
            resourceId: response.data.id,
            httpStatus: response.status,
            request: resourceData,
            response: response.data
        });

        console.log(`${resourceType} 建立成功`);
        console.log("Resource ID:", response.data.id);
    
        res.status(response.status).json({
            status: "success",
            message: `${resourceType} 建立成功`,
            httpStatus: response.status,
            resourceId: response.data.id,
            versionId: response.data.meta?.versionId,
            location: response.headers.location,
            data: response.data,
        });
    } catch (error) {
        // 記錄 Resource 建立失敗的交換歷程
        addExchangeLog({
            operation: "Create",
            resourceType: resourceType,
            resourceId: null,
            httpStatus: error.response?.status || 500,
            request: req.body,
            response: error.response?.data || {
                message: error.message
            }
        });

        console.error(
            `${resourceType} 建立失敗：`,
            error.response?.data || error.message,
        );

        res.status(error.response?.status || 500).json({
            status: "error",
            message: `${resourceType} 建立失敗`,
            httpStatus: error.response?.status || 500,
            error: error.response?.data || error.message,
        });
    }
});

// 共用 Resource 單筆查詢 API
app.get("/api/fhir/:resourceType/:id", async (req, res) => {
    const { resourceType, id } = req.params;

    try {
        if (!allowedTypes.includes(resourceType)) {
            return res.status(400).json({
                status: "error",
                message: "不支援的 Resource Type",
            });
        }
    
        const response = await readResource(resourceType, id);

        // 記錄 Resource 查詢成功的交換歷程
        addExchangeLog({
            operation: "Read",
            resourceType: resourceType,
            resourceId: response.data.id,
            httpStatus: response.status,
            request: {
                resourceType: resourceType,
                id: id
            },
            response: response.data
        });
        

        console.log(`${resourceType} 查詢成功`);
        console.log("Resource ID:", response.data.id);
    
        res.status(response.status).json({
            status: "success",
            message: `${resourceType} 查詢成功`,
            httpStatus: response.status,
            resourceId: response.data.id,
            versionId: response.data.meta?.versionId,
            data: response.data,
        });
    } catch (error) {
        // 記錄 Resource 查詢失敗的交換歷程
        addExchangeLog({
            operation: "Read",
            resourceType: resourceType,
            resourceId: id,
            httpStatus: error.response?.status || 500,
            request: {
                resourceType: resourceType,
                id: id
            },
            response: error.response?.data || {
                message: error.message
            }
        });


        console.error(
            `${resourceType} 查詢失敗：`,
            error.response?.data || error.message,
        );
        
        res.status(error.response?.status || 500).json({
            status: "error",
            message: `${resourceType} 查詢失敗`,
            httpStatus: error.response?.status || 500,
            error: error.response?.data || error.message,
        });
    }
});

// 各 Resource 允許使用的搜尋參數
const allowedSearchParams = {
    Organization: [
        "name",
        "identifier",
        "active",
        "_count",
        "_getpages",
        "_getpagesoffset",
        "_pretty",
        "_bundletype"
    ],

    Practitioner: [
        "name",
        "identifier",
        "active",
        "_count",
        "_getpages",
        "_getpagesoffset",
        "_pretty",
        "_bundletype"
    ],

    Patient: [
        "name",
        "identifier",
        "gender",
        "birthdate",
        "organization",
        "_count",
        "_getpages",
        "_getpagesoffset",
        "_pretty",
        "_bundletype"
    ]
};


// Shared Search : 共用 Resource 搜尋 API
app.get("/api/fhir/:resourceType", async (req, res) => {
    const { resourceType } = req.params;

    try {
        if (!allowedTypes.includes(resourceType)) {
            return res.status(400).json({
                status: "error",
                message: "不支援的 Resource Type"
            });
        }

        const params = { ...req.query };

        // 檢查搜尋參數是否在允許清單內
        const allowedParams = allowedSearchParams[resourceType];

        const invalidParams = Object.keys(params).filter(
            param => !allowedParams.includes(param)
        );

        if (invalidParams.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "不支援的搜尋參數",
                invalidParams
            });
        }

        const response = await searchResource(resourceType, params);

        // 記錄 Resource 搜尋成功的交換歷程
        addExchangeLog({
            operation: "Search",
            resourceType: resourceType,
            resourceId: null,
            httpStatus: response.status,
            request: params,
            response: response.data
        });

        console.log(`${resourceType} 搜尋成功`);

        res.status(response.status).json({
            status: "success",
            message: `${resourceType} 搜尋成功`,
            httpStatus: response.status,
            total: response.data.total,
            data: response.data
        });

    } catch (error) {
        // 記錄 Resource 搜尋失敗的交換歷程
        addExchangeLog({
            operation: "Search",
            resourceType: resourceType,
            resourceId: null,
            httpStatus: error.response?.status || 500,
            request: req.query,
            response: error.response?.data || {
                message: error.message
            }
        });


        console.error(
            "FHIR Resource 搜尋失敗：",
            error.response?.data || error.message
        );

        res.status(error.response?.status || 500).json({
            status: "error",
            message: "FHIR Resource 搜尋失敗",
            httpStatus: error.response?.status || 500,
            error: error.response?.data || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend Server running: http://localhost:${PORT}`);
});