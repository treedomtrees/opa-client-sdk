import { OpaClientError } from './opaClientError'
import { OpaQueryInput } from '../types'

export class OpaClientNotFoundError<
  TInput = OpaQueryInput,
> extends OpaClientError<TInput> {
  constructor(resource: string, input?: TInput) {
    super(`OPA resource ${resource} not found`, resource, input)
  }
}
