// FHIR 資料交換歷程紀錄
const exchangeLogs = [];

// 新增一筆交換紀錄
function addExchangeLog(logData) {
    const log = {
        id: exchangeLogs.length + 1,
        timestamp: new Date().toISOString(),
        operation: logData.operation,
        resourceType: logData.resourceType,
        resourceId: logData.resourceId || null,
        httpStatus: logData.httpStatus,
        request: logData.request || null,
        response: logData.response || null
    };

    exchangeLogs.push(log);

    return log;
}

// 取得所有交換紀錄
function getExchangeLogs() {
    return exchangeLogs;
}

// 清空交換紀錄
function clearExchangeLogs() {
    exchangeLogs.length = 0;
}

module.exports = {
    addExchangeLog,
    getExchangeLogs,
    clearExchangeLogs
};