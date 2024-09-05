import { OpaClientError } from './opaClientError'
import { OpaQueryInput } from '../types'

export class OpaClientServerError<
  TInput = OpaQueryInput,
> extends OpaClientError<TInput> {
  constructor(resource: string, input?: TInput) {
    super(
      `OPA server error occurs retrieving resource ${resource}`,
      resource,
      input
    )
  }
}
