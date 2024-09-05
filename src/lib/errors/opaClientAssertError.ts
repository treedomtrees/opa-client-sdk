import { OpaClientError } from './opaClientError'
import { OpaQueryInput } from '../types'

export class OpaClientAssertError<
  TInput = OpaQueryInput,
> extends OpaClientError<TInput> {
  constructor(
    resource: string,
    readonly expected: boolean,
    input?: TInput
  ) {
    super(`OPA assert failed for resource ${resource}`, resource, input)
  }
}
