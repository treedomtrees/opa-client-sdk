import { OpaQueryInput } from '../types'

export class OpaClientError<TInput = OpaQueryInput> extends Error {
  constructor(
    message: string,
    readonly resource: string,
    readonly input?: TInput
  ) {
    /* c8 ignore next */
    super(message ?? 'OPA Client Error')
  }
}
