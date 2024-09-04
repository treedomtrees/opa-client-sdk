export type OpaQueryInput = {
  subject: {
    id: string | number
    type?: string
  }

  resource?: {
    id: string | number
    type?: string
  }

  [x: string]: unknown
}
