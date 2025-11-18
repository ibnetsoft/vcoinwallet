# 관리자 페이지 자료실 관리 기능 추가 가이드

## 1. 자료실 탭 추가를 위한 수정사항

### 1-1. fetchResources 함수 추가 (fetchNotices 함수 아래에 추가)

```typescript
// 약 309줄 아래에 추가
const fetchResources = async () => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch('/api/admin/resources', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      setResources(data.resources || [])
    }
  } catch (error) {
    console.error('자료 가져오기 실패:', error)
  }
}

const handleFileUpload = async (file: File) => {
  const token = localStorage.getItem('token')

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || '파일 업로드 실패')
    }

    setUploadedFile(result.file)
    toast.success('파일이 업로드되었습니다.')
    return result.file
  } catch (error: any) {
    toast.error(error.message || '파일 업로드 중 오류가 발생했습니다.')
    return null
  }
}

const handleCreateResource = async () => {
  if (!resourceForm.title || !resourceForm.content) {
    toast.error('제목과 내용을 입력해주세요.')
    return
  }

  const token = localStorage.getItem('token')

  try {
    // 파일 업로드 (있는 경우)
    let fileData = uploadedFile
    if (resourceForm.file && !uploadedFile) {
      fileData = await handleFileUpload(resourceForm.file)
      if (!fileData) return
    }

    const response = await fetch('/api/admin/resources', {
      method: editingResourceId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resourceId: editingResourceId,
        type: resourceForm.type,
        title: resourceForm.title,
        content: resourceForm.content,
        fileUrl: fileData?.url,
        fileName: fileData?.name,
        fileSize: fileData?.size,
        fileType: fileData?.type
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || '게시글 작성 실패')
    }

    toast.success(result.message)
    setIsResourceModalOpen(false)
    setResourceForm({ type: 'NOTICE', title: '', content: '', file: null })
    setUploadedFile(null)
    setEditingResourceId(null)
    fetchResources()
  } catch (error: any) {
    toast.error(error.message || '게시글 작성 중 오류가 발생했습니다.')
  }
}

const handleDeleteResource = async (resourceId: string) => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  const token = localStorage.getItem('token')

  try {
    const response = await fetch('/api/admin/resources', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ resourceId })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || '게시글 삭제 실패')
    }

    toast.success('게시글이 삭제되었습니다.')
    fetchResources()
  } catch (error: any) {
    toast.error(error.message || '게시글 삭제 중 오류가 발생했습니다.')
  }
}

const handleEditResource = (resource: any) => {
  setEditingResourceId(resource.id)
  setResourceForm({
    type: resource.type,
    title: resource.title,
    content: resource.content,
    file: null
  })
  if (resource.file_url) {
    setUploadedFile({
      url: resource.file_url,
      name: resource.file_name,
      size: resource.file_size,
      type: resource.file_type
    })
  }
  setIsResourceModalOpen(true)
}
```

### 1-2. useEffect 추가 (공지사항 useEffect 아래에 추가, 약 229줄 아래)

```typescript
// 자료실 탭 접속 시 자료 불러오기
useEffect(() => {
  if (activeTab === 'resources') {
    fetchResources()
  }
}, [activeTab])
```

### 1-3. 탭 버튼 추가 (공지사항 탭 버튼 아래에 추가, 약 1200줄 근처)

```typescript
<button
  onClick={() => setActiveTab('resources')}
  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
    activeTab === 'resources'
      ? 'text-yellow-400'
      : 'text-gray-400 hover:text-gray-300'
  }`}
>
  {coinSettings.boardName || '자료실'}
  {activeTab === 'resources' && (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
  )}
</button>
```

### 1-4. 자료실 탭 콘텐츠 추가 (공지사항 탭 콘텐츠 아래에 추가)

```typescript
{/* 자료실 탭 */}
{activeTab === 'resources' && (
  <div className="bg-gray-800/50 rounded-xl p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">{coinSettings.boardName || '자료실'} 관리</h2>
      <button
        onClick={() => {
          setIsResourceModalOpen(true)
          setEditingResourceId(null)
          setResourceForm({ type: 'NOTICE', title: '', content: '', file: null })
          setUploadedFile(null)
        }}
        className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
      >
        + 새 자료 등록
      </button>
    </div>

    <div className="space-y-4">
      {resources.length === 0 ? (
        <p className="text-gray-400 text-center py-8">등록된 자료가 없습니다.</p>
      ) : (
        resources.map((resource) => (
          <div key={resource.id} className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    resource.type === 'IMPORTANT' ? 'bg-red-500' :
                    resource.type === 'NOTICE' ? 'bg-blue-500' :
                    resource.type === 'EVENT' ? 'bg-green-500' :
                    resource.type === 'UPDATE' ? 'bg-purple-500' :
                    'bg-gray-500'
                  } text-white`}>
                    {resource.type === 'IMPORTANT' ? '중요' :
                     resource.type === 'NOTICE' ? '공지' :
                     resource.type === 'EVENT' ? '이벤트' :
                     resource.type === 'UPDATE' ? '업데이트' : '일반'}
                  </span>
                  {resource.file_url && (
                    <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">
                      📎 첨부파일
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{resource.title}</h3>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{resource.content}</p>
                {resource.file_url && (
                  <p className="text-gray-500 text-xs">
                    파일: {resource.file_name} ({(resource.file_size / 1024).toFixed(1)} KB)
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  작성: {resource.author_name} | {new Date(resource.created_at).toLocaleString('ko-KR')}
                  {' '} | 조회 {resource.view_count} | 다운로드 {resource.download_count}
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEditResource(resource)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition text-sm"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition text-sm"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}

{/* 자료 작성/수정 모달 */}
{isResourceModalOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsResourceModalOpen(false)}>
    <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-xl font-bold text-white mb-4">
        {editingResourceId ? '자료 수정' : '새 자료 등록'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            유형
          </label>
          <select
            value={resourceForm.type}
            onChange={(e) => setResourceForm({...resourceForm, type: e.target.value})}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="IMPORTANT">중요</option>
            <option value="NOTICE">공지</option>
            <option value="INFO">일반</option>
            <option value="EVENT">이벤트</option>
            <option value="UPDATE">업데이트</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            제목
          </label>
          <input
            type="text"
            value={resourceForm.title}
            onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            내용
          </label>
          <textarea
            value={resourceForm.content}
            onChange={(e) => setResourceForm({...resourceForm, content: e.target.value})}
            rows={10}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="내용을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            첨부파일 (최대 {(coinSettings.boardMaxFileSize / (1024 * 1024)).toFixed(0)} MB)
          </label>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (file.size > coinSettings.boardMaxFileSize) {
                  toast.error(`파일 크기는 ${(coinSettings.boardMaxFileSize / (1024 * 1024)).toFixed(0)}MB를 초과할 수 없습니다.`)
                  e.target.value = ''
                  return
                }
                setResourceForm({...resourceForm, file})
                setUploadedFile(null)
              }
            }}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {uploadedFile && (
            <p className="text-green-400 text-sm mt-2">
              ✓ {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          {resourceForm.file && !uploadedFile && (
            <p className="text-yellow-400 text-sm mt-2">
              선택됨: {resourceForm.file.name} ({(resourceForm.file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => {
            setIsResourceModalOpen(false)
            setResourceForm({ type: 'NOTICE', title: '', content: '', file: null })
            setUploadedFile(null)
            setEditingResourceId(null)
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
        >
          취소
        </button>
        <button
          onClick={handleCreateResource}
          className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
        >
          {editingResourceId ? '수정' : '등록'}
        </button>
      </div>
    </div>
  </div>
)}
```

## 2. 시스템 설정 로드 추가

`useEffect`에서 시스템 설정을 로드하는 부분에 (약 170줄 근처):

```typescript
// 시스템 설정 불러오기 (Supabase에서)
const loadSystemConfig = async () => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch('/api/admin/system-config', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.config) {
        setCoinSettings({
          newUserReward: data.config.securityCoinNewUser,
          referralBonus: data.config.securityCoinReferral,
          dividendCoinPer100: data.config.dividendCoinPer100,
          referralBonusPercentage: data.config.dividendCoinReferralPercentage,
          youtubeUrl: data.config.youtubeUrl,
          boardName: data.config.boardName || '자료실',
          boardMaxFileSize: data.config.boardMaxFileSize || 10485760
        })
      }
    }
  } catch (error) {
    console.error('시스템 설정 불러오기 실패:', error)
  }
}

// useEffect에서 호출
loadSystemConfig()
```

## 3. 완료!

이제 다음 기능들이 동작합니다:
- ✅ 관리자가 게시판 이름 설정
- ✅ 관리자가 파일 최대 크기 설정 (5MB ~ 100MB)
- ✅ 파일 첨부 기능
- ✅ 자료 CRUD (생성, 읽기, 수정, 삭제)
- ✅ 조회수/다운로드수 카운트
- ✅ 사용자용 자료실 페이지

## 4. Supabase SQL 실행

Supabase 대시보드에서 `supabase-resources-table.sql` 파일의 SQL을 실행하세요!
