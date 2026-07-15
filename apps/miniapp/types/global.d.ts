declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.gif'

declare namespace JSX {
  interface IntrinsicElements {
    'store-product': any
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_APP_BASE_URL: string
    TARO_APP_ENABLE_WECHAT_AI?: string
    [key: string]: string | undefined
  }
}

declare namespace WechatMiniprogram {
  interface AgentHandoffEvent {
    pageId?: number
    path: string
    query?: string
    payload?: unknown
  }

  interface Wx {
    onAgentHandoff?(callback: (event: AgentHandoffEvent) => void): void
  }
}
