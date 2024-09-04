import tap from 'tap'
import { OpenPolicyAgentClient } from '../src'
import { MockAgent, setGlobalDispatcher } from 'undici'
import { Interceptable } from 'undici/types/mock-interceptor'
import { LRUCache } from 'lru-cache'
import { OpaClientServerError } from '../src/errors/opaClientServerError'
import { OpaClientBadRequestError } from '../src/errors/opaClientBadRequestError'
import { OpaClientNotFoundError } from '../src/errors/opaClientNotFoundError'
import { OpaClientUnknownError } from '../src/errors/opaClientUnknownError'

const opaUrl = 'https://opa.test'

let agent: MockAgent
let opaInterceptor: Interceptable

tap.beforeEach(() => {
  agent = new MockAgent()
  agent.disableNetConnect()
  setGlobalDispatcher(agent)

  opaInterceptor = agent.get(opaUrl)
})

tap.test('constructor', async (t) => {
  t.test('should use opaVersion specified', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v2/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient({
      url: opaUrl,
      opaVersion: 'v2',
    })

    const queryResult = await opaClient.query('my.resource.allow')

    t.same(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test('should use method specified', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'GET',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient({
      url: opaUrl,
      method: 'GET',
    })

    const queryResult = await opaClient.query('my.resource.allow')

    t.same(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })
})

tap.test('query function', async (t) => {
  t.test('should query requested resource', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const queryResult = await opaClient.query('my.resource.allow')

    t.same(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test('should query requested resource with payload', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply((req) => {
        t.same(
          JSON.parse(req.body as string),
          {
            input: { test: 'data' },
          },
          'request body should contain expected input'
        )

        return {
          statusCode: 200,
          data: JSON.stringify({
            result: true,
          }),
        }
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const queryResult = await opaClient.query('my.resource.allow', {
      test: 'data',
    })

    t.same(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test('should query cached requested resource', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient({
      url: opaUrl,
      cache: new LRUCache({
        max: 100,
      }),
    })

    const queryResult = await opaClient.query('my.resource.allow')
    t.same(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    const cachedQueryResult = await opaClient.query('my.resource.allow')
    t.same(
      cachedQueryResult,
      { result: true },
      'cached query response should match expected'
    )

    t.throws(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should not have been called'
    )
  })

  t.test(
    'should query cached requested resource twice due to cache clear',
    async (t) => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(200, {
          result: true,
        })

      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(200, {
          result: true,
        })

      const opaClient = new OpenPolicyAgentClient({
        url: opaUrl,
        cache: new LRUCache({
          max: 100,
        }),
      })

      const queryResult1 = await opaClient.query('my.resource.allow')
      t.same(
        queryResult1,
        { result: true },
        'query response should match expected'
      )

      opaClient.cache?.clear()

      const queryResult2 = await opaClient.query('my.resource.allow')
      t.same(
        queryResult2,
        { result: true },
        'cached query response should match expected'
      )

      t.doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )

  t.test('should throw when the server returns 500 status code', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(500, {
        error: true,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    t.rejects(
      () => opaClient.query('my.resource.allow'),
      new OpaClientServerError('my.resource.allow', undefined),
      'should throw when the server returns 500 status code'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test('should throw when the server returns 400 status code', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(400, {
        warning: {
          code: 'invalid_input',
          message: 'Invalid input',
        },
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    t.rejects(
      () => opaClient.query('my.resource.allow'),
      new OpaClientBadRequestError('my.resource.allow', undefined, {
        warning: {
          code: 'invalid_input',
          message: 'Invalid input',
        },
      }),
      'should throw when the server returns 400 status code'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test(
    'should throw when the server returns a status code that not match 200',
    async (t) => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(300, {})

      const opaClient = new OpenPolicyAgentClient(opaUrl)

      t.rejects(
        () => opaClient.query('my.resource.allow'),
        new OpaClientUnknownError('my.resource.allow', 300, undefined),
        "should throw when the server returns a status code that doesn't match 200"
      )

      t.doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )
})

tap.test('assert function', async (t) => {
  t.test('should not reject when assert succeeds', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    t.resolves(
      () => opaClient.assert('my.resource.allow'),
      'assert should resolve'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test('should reject when assert fails', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: false,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    t.rejects(
      () => opaClient.assert('my.resource.allow'),
      'assert should reject'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })
})

tap.test('evaluatePolicy function', async (t) => {
  t.test('should return true when policy match', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const evaluatePolicyResult =
      await opaClient.evaluatePolicy('my.resource.allow')

    t.same(
      evaluatePolicyResult,
      true,
      'evaluatePolicy response should match expected'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test('should return false when policy not match', async (t) => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: false,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const evaluatePolicyResult =
      await opaClient.evaluatePolicy('my.resource.allow')

    t.same(
      evaluatePolicyResult,
      false,
      'evaluatePolicy response should match expected'
    )

    t.doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  t.test(
    'should throw when the response not contains result property',
    async (t) => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(200, {})

      const opaClient = new OpenPolicyAgentClient(opaUrl)

      t.rejects(
        () => opaClient.evaluatePolicy('my.resource.allow'),
        new OpaClientNotFoundError('my.resource.allow', undefined),
        'should throw when the response not contains result property'
      )

      t.doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )
})
