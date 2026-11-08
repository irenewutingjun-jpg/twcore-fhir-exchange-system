
<script setup>
import { ref, computed, onMounted } from 'vue'

const activePage = ref('home')

// Resource 查詢資料
const searchOrganizationId = ref('')
const patientSearchResult = ref(null)
const patientSearchMessage = ref('')
const patientSearchLoading = ref(false)

// Patient 單筆查詢
const searchPatientId = ref('')
const singlePatientResult = ref(null)
const singlePatientMessage = ref('')
const singlePatientHttpStatus = ref(null)
const singlePatientLoading = ref(false)

// 交換歷程資料
const exchangeLogs = ref([])
const logSearchId = ref('')

// 依 Resource ID 篩選交換紀錄
const filteredExchangeLogs = computed(() => {
  const keyword = logSearchId.value.trim()

  if (!keyword) {
    return exchangeLogs.value
  }

  return exchangeLogs.value.filter(log =>
    String(log.resourceId ?? '').includes(keyword)
  )
})


const logsMessage = ref('')
const logsLoading = ref(false)


const serverStatus = ref('尚未測試')
const serverMessage = ref('')
const fhirVersion = ref('-')
const serverName = ref('-')
const isLoading = ref(false)

// Organization 表單資料
const organizationName = ref('')
const organizationIdentifier = ref('')
const organizationMessage = ref('')
const organizationResult = ref(null)
const organizationHttpStatus = ref(null)
const organizationLoading = ref(false)

// Practitioner 表單資料
const practitionerName = ref('')
const practitionerIdentifier = ref('')
const practitionerGender = ref('')
const practitionerMessage = ref('')
const practitionerResult = ref(null)
const practitionerHttpStatus = ref(null)
const practitionerLoading = ref(false)

// Patient 表單資料
const patientName = ref('')
const patientIdentifier = ref('')
const patientGender = ref('')
const patientBirthDate = ref('')
const patientOrganization = ref('')
const patientPractitioner = ref('')
const patientMessage = ref('')
const patientResult = ref(null)
const patientHttpStatus = ref(null)
const patientLoading = ref(false)

// 已建立成功的 Resource 清單
const organizationList = ref([])
const practitionerList = ref([])

// Organization 搜尋功能
const organizationSearch = ref('')

// 依照機構名稱或 Resource ID 篩選 Organization
const filteredOrganizationList = computed(() => {
  const keyword = organizationSearch.value.trim().toLowerCase()

  if (!keyword) {
    return organizationList.value
  }

  return organizationList.value.filter(item => {
    const resource = item.resource

    const name = resource.name || ''
    const id = String(resource.id || '')

    return (
      name.toLowerCase().includes(keyword) ||
      id.toLowerCase().includes(keyword)
    )
  })
})

// Practitioner 搜尋功能
const practitionerSearch = ref('')

// 依照姓名或 Resource ID 篩選 Practitioner
const filteredPractitionerList = computed(() => {
  const keyword = practitionerSearch.value.trim().toLowerCase()

  if (!keyword) {
    return practitionerList.value
  }

  return practitionerList.value.filter(item => {
    const resource = item.resource

    const name =
      resource.name?.[0]?.text ||
      [
        ...(resource.name?.[0]?.given || []),
        resource.name?.[0]?.family
      ].filter(Boolean).join(' ')

    const id = String(resource.id || '')

    return (
      name.toLowerCase().includes(keyword) ||
      id.toLowerCase().includes(keyword)
    )
  })
})

// 選單項目
const menuItems = [
  { id: 'home', icon: '⌂', label: '系統首頁' },
  { id: 'create', icon: '＋', label: 'Resource 建立' },
  { id: 'search', icon: '⌕', label: 'Resource 查詢' },
  { id: 'logs', icon: '▤', label: '交換歷程' },
  { id: 'system', icon: '⚙', label: '系統資訊' }
]

// 測試 FHIR Server 連線
const testBackend = async () => {
  isLoading.value = true
  serverStatus.value = '連線中...'
  serverMessage.value = ''

  try {
    const response = await fetch(
      'http://localhost:3000/api/fhir/metadata'
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    serverStatus.value = '連線成功'
    serverMessage.value = data.message
    fhirVersion.value = data.fhirVersion || '-'
    serverName.value = data.serverName || '-'

  } catch (error) {
    serverStatus.value = '連線失敗'
    serverMessage.value = error.message
    fhirVersion.value = '-'
    serverName.value = '-'

  } finally {
    isLoading.value = false
  }
}

// 建立 Organization
const createOrganization = async () => {
  organizationLoading.value = true
  organizationMessage.value = ''

  try {
    const response = await fetch(
      'http://localhost:3000/api/fhir/Organization',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json'
        },
        body: JSON.stringify({
          resourceType: 'Organization',
          meta: {
            profile: [
              'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition/Organization-hosp-twcore'
            ]
          },
          identifier: organizationIdentifier.value
            ? [{
                system: 'https://www.example.org/identifiers/organization',
                value: organizationIdentifier.value
              }]
            : [],
          active: true,
          name: organizationName.value
        })
      }
    )

    const data = await response.json()

    organizationResult.value = data.data;
    organizationHttpStatus.value = data.httpStatus;

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2))
    }

    organizationMessage.value =
      `建立成功！Resource ID：${data.resourceId}`

    organizationName.value = ''
    organizationIdentifier.value = ''

  } catch (error) {
    organizationMessage.value =
      `建立失敗：${error.message}`

  } finally {
    organizationLoading.value = false
  }
}

// 建立 Practitioner
const createPractitioner = async () => {
  practitionerLoading.value = true
  practitionerMessage.value = ''
  practitionerResult.value = null
  practitionerHttpStatus.value = null

  try {
    const response = await fetch(
      'http://localhost:3000/api/fhir/Practitioner',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json'
        },
        body: JSON.stringify({
          resourceType: 'Practitioner',
          meta: {
            profile: [
              'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition/Practitioner-twcore'
            ]
          },
          identifier: practitionerIdentifier.value
            ? [{
                system: 'https://www.example.org/identifiers/practitioner',
                value: practitionerIdentifier.value
              }]
            : [],
          active: true,
          name: [{
            text: practitionerName.value
          }],
          ...(practitionerGender.value
            ? { gender: practitionerGender.value }
            : {})
        })
      }
    )

    const data = await response.json()

    practitionerResult.value = data.data
    practitionerHttpStatus.value = data.httpStatus

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2))
    }

    practitionerMessage.value =
      `建立成功！Resource ID：${data.resourceId}`

    practitionerName.value = ''
    practitionerIdentifier.value = ''
    practitionerGender.value = ''

  } catch (error) {
    practitionerMessage.value =
      `建立失敗：${error.message}`

  } finally {
    practitionerLoading.value = false
  }
}

// 建立 Patient
const createPatient = async () => {
  patientLoading.value = true
  patientMessage.value = ''
  patientResult.value = null
  patientHttpStatus.value = null

  try {
    // 確認已選擇所屬機構及醫事人員
    if (!patientOrganization.value || !patientPractitioner.value) {
      throw new Error('請選擇所屬機構及負責醫事人員')
    }

    const response = await fetch(
      'http://localhost:3000/api/fhir/Patient',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json'
        },
        body: JSON.stringify({
          resourceType: 'Patient',
          meta: {
            profile: [
              'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition/Patient-twcore'
            ]
          },
          identifier: patientIdentifier.value
            ? [{
                system: 'https://www.example.org/identifiers/patient',
                value: patientIdentifier.value
              }]
            : [],
          active: true,
          name: [{
            text: patientName.value
          }],
          ...(patientGender.value
            ? { gender: patientGender.value }
            : {}),
          ...(patientBirthDate.value
            ? { birthDate: patientBirthDate.value }
            : {}),
          managingOrganization: {
            reference: patientOrganization.value
          },
          generalPractitioner: [{
            reference: patientPractitioner.value
          }]
        })
      }
    )

    const data = await response.json()

    patientResult.value = data.data
    patientHttpStatus.value = data.httpStatus

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2))
    }

    patientMessage.value =
      `建立成功！Resource ID：${data.resourceId}`

    patientName.value = ''
    patientIdentifier.value = ''
    patientGender.value = ''
    patientBirthDate.value = ''
    patientOrganization.value = ''
    patientPractitioner.value = ''

  } catch (error) {
    patientMessage.value =
      `建立失敗：${error.message}`

  } finally {
    patientLoading.value = false
  }
}

// 依照 Organization 查詢 Patient
const searchPatientsByOrganization = async () => {
  patientSearchLoading.value = true
  patientSearchMessage.value = ''
  patientSearchResult.value = null

  try {
    if (!searchOrganizationId.value) {
      throw new Error('請先選擇 Organization')
    }

    const params = new URLSearchParams({
      organization: searchOrganizationId.value
    })

    const response = await fetch(
      `http://localhost:3000/api/fhir/Patient?${params.toString()}`
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message || JSON.stringify(data, null, 2)
      )
    }

    patientSearchResult.value = data.data

    patientSearchMessage.value =
      `查詢成功！共找到 ${data.data.total || 0} 筆 Patient`

  } catch (error) {
    patientSearchMessage.value =
      `查詢失敗：${error.message}`

  } finally {
    patientSearchLoading.value = false
  }
}

// 依 Patient ID 查詢單筆 Patient
const searchPatientById = async () => {
  singlePatientLoading.value = true
  singlePatientMessage.value = ''
  singlePatientResult.value = null
  singlePatientHttpStatus.value = null

  try {
    if (!searchPatientId.value.trim()) {
      throw new Error('請輸入 Patient Resource ID')
    }

    const response = await fetch(
      `http://localhost:3000/api/fhir/Patient/${encodeURIComponent(searchPatientId.value.trim())}`
    )

    const data = await response.json()

    singlePatientHttpStatus.value = data.httpStatus || response.status

    if (!response.ok) {
      throw new Error(
        data.message || JSON.stringify(data, null, 2)
      )
    }

    singlePatientResult.value = data.data

    singlePatientMessage.value =
      `查詢成功！Patient ID：${data.data.id}`

  } catch (error) {
    singlePatientMessage.value =
      `查詢失敗：${error.message}`

  } finally {
    singlePatientLoading.value = false
  }
}

// 取得所有 FHIR 交換紀錄
const loadExchangeLogs = async () => {
  logsLoading.value = true
  logsMessage.value = ''

  try {
    const response = await fetch(
      'http://localhost:3000/api/fhir/logs'
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '交換紀錄載入失敗')
    }

    exchangeLogs.value = [...(data.data || [])].reverse()

    logsMessage.value =
      `成功載入 ${data.total || 0} 筆交換紀錄`

  } catch (error) {
    logsMessage.value =
      `載入失敗：${error.message}`

  } finally {
    logsLoading.value = false
  }
}

// 清空所有 FHIR 交換紀錄
const clearExchangeLogs = async () => {
  if (!confirm('確定要清空所有交換紀錄嗎？')) {
    return
  }

  try {
    const response = await fetch(
      'http://localhost:3000/api/fhir/logs',
      {
        method: 'DELETE'
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '清空交換紀錄失敗')
    }

    logsMessage.value = '交換紀錄已清空'

    // 重新載入紀錄
    await loadExchangeLogs()

  } catch (error) {
    logsMessage.value = `清空失敗：${error.message}`
  }
}

// 取得 FHIR Server 的完整搜尋結果（包含所有分頁）
const fetchAllResources = async (resourceType) => {
  let allEntries = []
  let nextUrl = `http://localhost:3000/api/fhir/${resourceType}?_count=50`

  while (nextUrl) {
    const response = await fetch(nextUrl)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || `${resourceType} 載入失敗`)
    }

    const bundle = result.data

    allEntries = allEntries.concat(bundle.entry || [])

    const nextLink = bundle.link?.find(
      link => link.relation === 'next'
    )

    if (nextLink?.url) {
      const url = new URL(nextLink.url)
      nextUrl = `http://localhost:3000/api/fhir/${resourceType}${url.search}`
    } else {
      nextUrl = null
    }
  }

  return allEntries
}


// 載入 FHIR Server 上所有 Organization 和 Practitioner
const loadReferenceResources = async () => {
  try {
    organizationList.value = await fetchAllResources('Organization')
    console.log('Organization 總筆數：', organizationList.value.length)
  } catch (error) {
    console.error('Organization 載入失敗：', error)
  }

  try {
    practitionerList.value = await fetchAllResources('Practitioner')
    console.log('Practitioner 總筆數：', practitionerList.value.length)
    console.log('第一筆 Practitioner 資料：', practitionerList.value[0])
  } catch (error) {
    console.error('Practitioner 載入失敗：', error)
  }
}

onMounted(() => {
  testBackend()
  loadReferenceResources()
})

</script>

<template>
  <div class="app-layout">

    <!-- 左側導覽列 -->
    <aside class="sidebar">
      <div class="sidebar-title">
        TW Core FHIR<br />
        交換測試系統
      </div>

      <nav class="sidebar-menu">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="menu-item"
          :class="{ active: activePage === item.id }"
          @click="activePage = item.id"
        >
          <span>{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <!-- 右側主要內容 -->
    <main class="main-content">

      <header class="page-header">
        <h1>TW Core FHIR 交換測試系統</h1>
        <p>台灣核心實作指引（TW Core IG）資料交換測試平台</p>
      </header>

      <!-- 系統首頁 -->
      <template v-if="activePage === 'home'">

        <section class="card">
          <h2>系統概況</h2>
          <p>歡迎使用 TW Core FHIR 交換測試系統。</p>
          <p style="margin-top: 8px; color: #718096">
            本系統提供 FHIR Resource 建立、查詢及資料交換歷程管理。
          </p>
        </section>

        <section class="dashboard-grid">

          <div class="dashboard-item">
            <div class="label">FHIR Server 連線狀態</div>
            <div
              class="value"
              :class="serverStatus === '連線成功'
                ? 'status-success'
                : 'status-error'"
            >
              {{ serverStatus }}
            </div>
          </div>

          <div class="dashboard-item">
            <div class="label">FHIR 版本</div>
            <div class="value">{{ fhirVersion }}</div>
          </div>

          <div class="dashboard-item">
            <div class="label">支援 Resource 類型</div>
            <div class="value">3 種</div>
            <p style="color: #718096; font-size: 13px">
              Organization / Practitioner / Patient
            </p>
          </div>

          <div class="dashboard-item">
            <div class="label">FHIR Server 名稱</div>
            <div class="value">{{ serverName }}</div>
          </div>

        </section>

        <section class="card" style="margin-top: 20px">
          <h2>FHIR Server 連線測試</h2>

          <p style="margin-bottom: 16px">
            {{ serverMessage || '尚未取得連線資訊' }}
          </p>

          <button
            class="btn btn-primary"
            @click="testBackend"
            :disabled="isLoading"
          >
            {{ isLoading ? '測試中...' : '重新測試連線' }}
          </button>
        </section>

      </template>

      <!-- Resource 建立 -->
      <template v-else-if="activePage === 'create'">

        <section class="card">
          <h2>Organization 建立</h2>
          <p>請輸入機構基本資料，建立 FHIR Organization Resource。</p>

          <form @submit.prevent="createOrganization">

            <div class="form-group">
              <label>機構名稱 *</label>
              <input
                v-model="organizationName"
                class="form-control"
                type="text"
                placeholder="例如：台灣測試醫院"
                required
              />
            </div>

            <div class="form-group">
              <label>機構識別碼</label>
              <input
                v-model="organizationIdentifier"
                class="form-control"
                type="text"
                placeholder="請輸入機構識別碼"
              />
            </div>

            <button
              class="btn btn-primary"
              type="submit"
              :disabled="organizationLoading"
            >
              {{ organizationLoading ? '建立中...' : '建立 Organization' }}
            </button>

          </form>

          <div v-if="organizationMessage" class="result-box">
              <h3>{{ organizationMessage }}</h3>
            
              <p v-if="organizationHttpStatus !== null">
                HTTP Status：{{ organizationHttpStatus }}
              </p>
            
              <div v-if="organizationResult">
                <h4>FHIR Server 回傳 JSON</h4>
                <pre>{{ JSON.stringify(organizationResult, null, 2) }}</pre>
              </div>
            </div>
        </section>

        <!-- Practitioner 建立 -->
        <section class="card">
          <h2>Practitioner 建立</h2>
          <p>請輸入醫事人員基本資料，建立 FHIR Practitioner Resource。</p>

          <form @submit.prevent="createPractitioner">

            <div class="form-group">
              <label>醫事人員姓名 *</label>
              <input
                v-model="practitionerName"
                class="form-control"
                type="text"
                placeholder="例如：王小明"
                required
              />
            </div>

            <div class="form-group">
              <label>醫事人員識別碼</label>
              <input
                v-model="practitionerIdentifier"
                class="form-control"
                type="text"
                placeholder="請輸入醫事人員識別碼"
              />
            </div>

            <div class="form-group">
              <label>性別</label>
              <select
                v-model="practitionerGender"
                class="form-control"
              >
                <option value="">請選擇</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">其他</option>
                <option value="unknown">未知</option>
              </select>
            </div>

            <button
              class="btn btn-primary"
              type="submit"
              :disabled="practitionerLoading"
            >
              {{ practitionerLoading ? '建立中...' : '建立 Practitioner' }}
            </button>

          </form>

          <div v-if="practitionerMessage" class="result-box">
            <h3>{{ practitionerMessage }}</h3>

            <p v-if="practitionerHttpStatus !== null">
              HTTP Status：{{ practitionerHttpStatus }}
            </p>

            <div v-if="practitionerResult">
              <h4>FHIR Server 回傳 JSON</h4>
              <pre>{{ JSON.stringify(practitionerResult, null, 2) }}</pre>
            </div>
          </div>
        </section>

        <!-- Patient 建立 -->
        <section class="card">
          <h2>Patient 建立</h2>
          <p>請輸入病人基本資料，並選擇所屬機構及負責醫事人員。</p>
        
          <form @submit.prevent="createPatient">
        
            <div class="form-group">
              <label>病人姓名 *</label>
              <input
                v-model="patientName"
                class="form-control"
                type="text"
                placeholder="例如：陳小華"
                required
              />
            </div>
        
            <div class="form-group">
              <label>病人識別碼</label>
              <input
                v-model="patientIdentifier"
                class="form-control"
                type="text"
                placeholder="請輸入病人識別碼"
              />
            </div>
        
            <div class="form-group">
              <label>性別</label>
              <select
                v-model="patientGender"
                class="form-control"
              >
                <option value="">請選擇</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">其他</option>
                <option value="unknown">未知</option>
              </select>
            </div>
        
            <div class="form-group">
              <label>出生日期</label>
              <input
                v-model="patientBirthDate"
                class="form-control"
                type="date"
              />
            </div>
        
            <div class="form-group">
              <label>所屬機構 Organization *</label>
              <input
                v-model="organizationSearch"
                type="text"
                class="form-control"
                placeholder="輸入機構名稱或 Resource ID 搜尋"
              />
              <select
                v-model="patientOrganization"
                class="form-control"
                required
              >
                <option value="">請選擇 Organization</option>
                <option
                  v-for="item in filteredOrganizationList"
                  :key="item.resource.id"
                  :value="`Organization/${item.resource.id}`"
                >
                  {{ item.resource.name }}（ID：{{ item.resource.id }}）
                </option>
              </select>
            </div>
        
            <div class="form-group">
              <label>負責醫事人員 Practitioner *</label>
              <input
                v-model="practitionerSearch"
                type="text"
                class="form-control"
                placeholder="輸入醫事人員姓名或 Resource ID 搜尋"
              />
              <select
                v-model="patientPractitioner"
                class="form-control"
                required
              >
                <option value="">請選擇 Practitioner</option>
                <option
                  v-for="item in filteredPractitionerList"
                  :key="item.resource.id"
                  :value="`Practitioner/${item.resource.id}`"
                >
                {{
                  item.resource.name?.[0]?.text ||
                  [
                    ...(item.resource.name?.[0]?.given || []),
                    item.resource.name?.[0]?.family
                  ].filter(Boolean).join(' ') ||
                  '未命名'
                }}
                （ID：{{ item.resource.id }}）
                </option>
              </select>
            </div>
        
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="patientLoading"
            >
              {{ patientLoading ? '建立中...' : '建立 Patient' }}
            </button>
        
          </form>
        
          <div v-if="patientMessage" class="result-box">
            <h3>{{ patientMessage }}</h3>
        
            <p v-if="patientHttpStatus !== null">
              HTTP Status：{{ patientHttpStatus }}
            </p>
        
            <div v-if="patientResult">
              <h4>FHIR Server 回傳 JSON</h4>
              <pre>{{ JSON.stringify(patientResult, null, 2) }}</pre>
            </div>
          </div>
        </section>
        
      </template>

      <!-- Resource 查詢 -->
      <template v-else-if="activePage === 'search'">
      
        <section class="card">
          <h2>依 Organization 查詢 Patient</h2>
          <p>請選擇機構，查詢該機構管理的所有 Patient。</p>
      
          <div class="form-group">
            <label>所屬機構 Organization</label>
            <input
              v-model="organizationSearch"
              type="text"
              class="form-control"
              placeholder="輸入機構名稱或 Resource ID 搜尋"
            />      
            <select
              v-model="searchOrganizationId"
              class="form-control"
            >
              <option value="">請選擇 Organization</option>
      
              <option
                v-for="item in filteredOrganizationList"
                :key="item.resource.id"
                :value="item.resource.id"
              >
                {{ item.resource.name }}（ID：{{ item.resource.id }}）
              </option>
            </select>
          </div>
      
          <button
            class="btn btn-primary"
            type="button"
            :disabled="patientSearchLoading"
            @click="searchPatientsByOrganization"
          >
            {{ patientSearchLoading ? '查詢中...' : '查詢 Patient' }}
          </button>
      
          <div v-if="patientSearchMessage" class="result-box">
            <h3>{{ patientSearchMessage }}</h3>
      
            <div v-if="patientSearchResult">
              <h4>FHIR Server 回傳 JSON</h4>
              <pre>{{ JSON.stringify(patientSearchResult, null, 2) }}</pre>
            </div>
          </div>
        </section>

        <!-- 依 Patient ID 查詢 -->
        <section class="card">
          <h2>依 Patient ID 查詢</h2>
          <p>請輸入 Patient Resource ID，讀取單筆病人資料。</p>
        
          <form @submit.prevent="searchPatientById">
        
            <div class="form-group">
              <label>Patient Resource ID</label>
        
              <input
                v-model="searchPatientId"
                class="form-control"
                type="text"
                placeholder="例如：259308"
                required
              />
            </div>
        
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="singlePatientLoading"
            >
              {{ singlePatientLoading ? '查詢中...' : '查詢 Patient' }}
            </button>
        
          </form>
        
          <div v-if="singlePatientMessage" class="result-box">
            <h3>{{ singlePatientMessage }}</h3>
        
            <p v-if="singlePatientHttpStatus !== null">
              HTTP Status：{{ singlePatientHttpStatus }}
            </p>
        
            <div v-if="singlePatientResult">
              <h4>FHIR Server 回傳 JSON</h4>
              <pre>{{ JSON.stringify(singlePatientResult, null, 2) }}</pre>
            </div>
          </div>
        </section>
      
      </template>

      <!-- 交換歷程 -->
      <template v-else-if="activePage === 'logs'">
        <section class="card">
          <h2>FHIR 資料交換歷程</h2>
          <p>查看系統與 FHIR Server 之間的資料交換紀錄。</p>
      
          <div class="button-group">
            <button
              type="button"
              @click="loadExchangeLogs"
              :disabled="logsLoading"
            >
              {{ logsLoading ? '載入中...' : '重新載入' }}
            </button>
      
            <button
              type="button"
              @click="clearExchangeLogs"
              :disabled="logsLoading || exchangeLogs.length === 0"
            >
              清空紀錄
            </button>
          </div>
      
          <p v-if="logsMessage">{{ logsMessage }}</p>
          <!-- Resource ID 搜尋 -->
          <div class="form-group">
            <label>搜尋 Resource ID</label>
          
            <input
              v-model="logSearchId"
              class="form-control"
              type="text"
              placeholder="例如：259376"
            />
          
            <p>
              符合條件：{{ filteredExchangeLogs.length }} 筆
            </p>
          </div>
                
                    <p v-if="!logsLoading && exchangeLogs.length === 0">
                      目前沒有交換紀錄。
                    </p>

                    <p v-if=" !logsLoading &&
                          exchangeLogs.length > 0 &&
                          filteredExchangeLogs.length === 0 "
                    >  找不到符合此 Resource ID 的交換紀錄。
                    </p>
                
                    <div
                      v-for="log in filteredExchangeLogs"
                      :key="log.id"
                      class="card"
                    >
            <h3>交換紀錄 #{{ log.id }}</h3>
      
            <p><strong>交換時間：</strong>{{ new Date(log.timestamp).toLocaleString() }}</p>
            <p><strong>操作類型：</strong>{{ log.operation }}</p>
            <p><strong>Resource 類型：</strong>{{ log.resourceType }}</p>
            <p><strong>Resource ID：</strong>{{ log.resourceId || '-' }}</p>
            <p><strong>HTTP Status：</strong>{{ log.httpStatus || '-' }}</p>
      
            <details>
              <summary>查看 Request JSON</summary>
              <pre>{{ JSON.stringify(log.request, null, 2) }}</pre>
            </details>
      
            <details>
              <summary>查看 Response JSON</summary>
              <pre>{{ JSON.stringify(log.response, null, 2) }}</pre>
            </details>
          </div>
        </section>
      </template>

      <!-- 系統資訊 -->
      <template v-else-if="activePage === 'system'">
        <section class="card">
          <h2>系統資訊</h2>
          <p>TW Core FHIR 資料交換測試系統基本資訊。</p>
      
          <h3>系統架構</h3>
          <p><strong>前端技術：</strong>Vue 3 + Vite</p>
          <p><strong>後端技術：</strong>Node.js + Express</p>
      
          <h3>FHIR Server 資訊</h3>
          <p><strong>FHIR 版本：</strong>{{ fhirVersion }}</p>
          <p><strong>Server 名稱：</strong>{{ serverName }}</p>
          <p><strong>連線狀態：</strong>{{ serverStatus }}</p>
      
          <h3>TW Core 使用的 Profile</h3>
          <ul>
            <li>Organization-hosp-twcore</li>
            <li>Practitioner-twcore</li>
            <li>Patient-twcore</li>
          </ul>
      
          <h3>FHIR Server 位址</h3>
          <p>https://hapi.fhir.tw/fhir</p>
        </section>
      </template>
      
      <!-- 其他功能 -->
      <section v-else class="card">
        <h2>{{ menuItems.find(item => item.id === activePage)?.label }}</h2>
        <p>此功能將於後續開發階段完成。</p>
      </section>

    </main>
  </div>
</template>
