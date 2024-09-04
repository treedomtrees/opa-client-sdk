import { OpaQueryInput } from '../types'

export class OpaClientError<TInput = OpaQueryInput> extends Error {
  constructor(
    message: string,
    readonly resource: string,
    readonly input?: TInput
  ) {
    /* istanbul ignore next */
    super(message ?? 'OPA Client Error')
  }
}
