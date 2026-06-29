declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.gif'

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_APP_BASE_URL: string
    [key: string]: string | undefined
  }
}

