'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, FileText, Factory, TrendingUp, Upload } from 'lucide-react'

interface UploadedDocument {
  key: string
  fileName: string
  contentType: string
  size: number
  url: string
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null)

  const handleUpload = async () => {
    if (!selectedFile || isUploading) {
      return
    }

    setUploadError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', 'dashboard-documents')

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as UploadedDocument | { error?: string }

      if (!response.ok) {
        setUploadError('error' in data && data.error ? data.error : 'Upload failed')
        return
      }

      setUploadedDocument(data as UploadedDocument)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload failed', error)
      setUploadError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">
          Welcome back, {user?.firstName} {user?.lastName}. Here&apos;s an overview of the system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,245</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +4.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Licenses</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">8,549</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Production Volume (L)</CardTitle>
            <Factory className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1.2M</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">System Status</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Healthy</div>
            <p className="text-xs text-slate-500 mt-1">All micro-zones operational</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Document Storage (MinIO)</CardTitle>
          <Upload className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>

          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

          {uploadedDocument && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-green-700">Uploaded: {uploadedDocument.fileName}</p>
              <p className="mt-1">
                <a
                  href={uploadedDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary-hover"
                >
                  Open stored document
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
