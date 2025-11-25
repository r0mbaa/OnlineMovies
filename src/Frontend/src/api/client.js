const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7070'

const buildHeaders = (body, customHeaders = {}) => {
  if (body instanceof FormData) {
    return customHeaders
  }

  return {
    'Content-Type': 'application/json',
    ...customHeaders
  }
}

const request = async (path, { method = 'GET', body, headers = {}, ...rest } = {}) => {
  const config = {
    method,
    credentials: 'include',
    headers: buildHeaders(body, headers),
    ...rest
  }

  if (body !== undefined) {
    config.body = body instanceof FormData ? body : JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config)

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = (isJson ? payload?.message ?? payload?.Message : payload) || 'Не удалось выполнить запрос'
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  if (!isJson) {
    return payload
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data
  }

  return payload
}

export { API_BASE_URL }
export default request


