import { baseUrl } from './config'

export function createSeedImageBase(publicBaseUrl: string): string {
  const normalizedBaseUrl = publicBaseUrl.replace(/\/+$/, '')
  return `${normalizedBaseUrl}/images/`
}

export const seedImageBase = createSeedImageBase(baseUrl)
