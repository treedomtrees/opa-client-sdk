export type OpaQueryInput = {
  subject?: {
    id: string | number
    type?: string
  }

  resource?: {
    id: string | number
    type?: string
  }

  headers?: {
    authorization?: string
    [x: string]: string
  }

  [x: string]: unknown
}
