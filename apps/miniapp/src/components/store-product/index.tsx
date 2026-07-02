import './index.scss'

interface StoreProductProps {
  appid?: string
  productId?: string
  customContent?: boolean
  openPage?: string
  logoPosition?: string
  customStyle?: Record<string, unknown>
  className?: string
  onEnterSuccess?: (event: any) => void
  onEnterError?: (event: any) => void
  children?: any
}

export default function StoreProduct(_: StoreProductProps) {
  return null
}
