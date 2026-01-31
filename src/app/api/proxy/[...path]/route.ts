/**
 * Proxy para evitar Mixed Content: cuando el front está en HTTPS (Vercel) y
 * el backend está en HTTP, el navegador bloquea las peticiones. Esta ruta
 * recibe las peticiones en el mismo origen (HTTPS) y las reenvía al backend (HTTP).
 * En Vercel configura BACKEND_API_URL=http://tu-ip:3001/api (solo servidor).
 */
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

async function proxyRequest(request: NextRequest, { path }: { path: string[] }) {
  const pathStr = path?.length ? path.join('/') : ''
  const search = request.nextUrl.search
  const url = `${BACKEND_API_URL.replace(/\/$/, '')}/${pathStr}${search}`

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    const auth = request.headers.get('Authorization')
    if (auth) headers['Authorization'] = auth

    const init: RequestInit = {
      method: request.method,
      headers,
      cache: 'no-store',
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) init.body = body
      } catch {
        // sin body
      }
    }

    const res = await fetch(url, init)
    const data = await res.text()
    const contentType = res.headers.get('Content-Type') || 'application/json'
    return new NextResponse(data, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        'Content-Type': contentType,
      },
    })
  } catch (err) {
    console.error('[api/proxy] Error:', err)
    return NextResponse.json(
      { message: 'Error al conectar con el backend. Comprueba BACKEND_API_URL.' },
      { status: 502 }
    )
  }
}
