'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Eye, FileText, Calendar, User } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Resource {
  id: string
  type: string
  title: string
  content: string
  author_name: string
  file_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  view_count: number
  download_count: number
  created_at: string
}

export default function ResourcesPage() {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [boardName, setBoardName] = useState('게시판')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadResources()
    loadBoardName()
  }, [router])

  const loadBoardName = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/system-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.config?.boardName) {
          setBoardName(data.config.boardName)
        }
      }
    } catch (error) {
      console.log('Failed to load board name')
    }
  }

  const loadResources = async () => {
    try {
      const response = await fetch('/api/resources')
      const data = await response.json()

      if (response.ok) {
        setResources(data.resources || [])
      } else {
        toast.error('자료를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('자료 불러오기 실패:', error)
      toast.error('자료를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = async (resource: Resource) => {
    setSelectedResource(resource)

    // 조회수 증가
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceId: resource.id,
          type: 'view'
        })
      })
    } catch (error) {
      console.error('조회수 증가 실패:', error)
    }
  }

  const handleDownload = async (resource: Resource) => {
    if (!resource.file_url) {
      toast.error('다운로드할 파일이 없습니다.')
      return
    }

    // 다운로드수 증가
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceId: resource.id,
          type: 'download'
        })
      })

      // 파일 다운로드
      window.open(resource.file_url, '_blank')
      toast.success('파일 다운로드가 시작되었습니다.')
    } catch (error) {
      console.error('다운로드 실패:', error)
      toast.error('파일 다운로드에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMPORTANT': return 'bg-red-500'
      case 'NOTICE': return 'bg-blue-500'
      case 'EVENT': return 'bg-green-500'
      case 'UPDATE': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IMPORTANT': return '중요'
      case 'NOTICE': return '공지'
      case 'EVENT': return '이벤트'
      case 'UPDATE': return '업데이트'
      default: return '일반'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Toaster position="top-center" />

      {/* 헤더 */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h1 className="text-2xl font-bold text-white">{boardName}</h1>
          </div>
        </div>
      </div>

      {/* 내용 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">
            불러오는 중...
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            등록된 자료가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 hover:border-yellow-500/50 transition cursor-pointer"
                onClick={() => handleView(resource)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(resource.type)} text-white`}>
                        {getTypeLabel(resource.type)}
                      </span>
                      {resource.file_url && (
                        <span className="px-2 py-1 text-xs rounded bg-green-600 text-white flex items-center">
                          <FileText className="w-3 h-3 mr-1" />
                          첨부파일
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {resource.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {resource.author_name}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(resource.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {resource.view_count}
                      </span>
                      {resource.file_url && (
                        <span className="flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          {resource.download_count}
                        </span>
                      )}
                    </div>
                  </div>
                  {resource.file_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(resource)
                      }}
                      className="ml-4 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-medium flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedResource(null)}>
          <div className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 text-sm rounded ${getTypeColor(selectedResource.type)} text-white`}>
                {getTypeLabel(selectedResource.type)}
              </span>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              {selectedResource.title}
            </h2>

            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6 pb-4 border-b border-gray-700">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {selectedResource.author_name}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(selectedResource.created_at).toLocaleString('ko-KR')}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                조회 {selectedResource.view_count}
              </span>
            </div>

            {selectedResource.file_url && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-yellow-400 mr-2" />
                    <div>
                      <p className="text-white font-medium">{selectedResource.file_name}</p>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(selectedResource.file_size)} · 다운로드 {selectedResource.download_count}회
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(selectedResource)}
                    className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-medium flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </button>
                </div>
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">
                {selectedResource.content}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedResource(null)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
