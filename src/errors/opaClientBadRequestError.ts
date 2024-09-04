import { OpaClientError } from './opaClientError'
import { OpaQueryInput } from '../types'

export type BadRequestBody = {
  warning?: {
    code: string
    message: string
  }
}

export class OpaClientBadRequestError<
  TInput = OpaQueryInput,
> extends OpaClientError<TInput> {
  constructor(
    resource: string,
    input?: TInput,
    readonly response?: BadRequestBody
  ) {
    super(`OPA bad request for resource ${resource}`, resource, input)
  }
}
