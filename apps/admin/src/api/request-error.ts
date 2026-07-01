interface ErrorLike {
  message?: string
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
}

export function getRequestErrorMessage(error: unknown, fallbackMessage: string): string {
  const requestError = error as ErrorLike | undefined
  const responseMessage = requestError?.response?.data?.message

  if (responseMessage) {
    return responseMessage
  }

  if (requestError?.message === '用户名或密码错误') {
    return requestError.message
  }

  if (typeof requestError?.response?.status === 'number') {
    return `登录服务异常（HTTP ${requestError.response.status}）`
  }

  if (requestError?.message === 'Network Error') {
    return '网络异常，请稍后重试'
  }

  return fallbackMessage
}
