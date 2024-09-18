# @treedom/opa-client-sdk

<a href="https://www.treedom.net/it/organization/treedom/event/treedom-open-source?utm_source=github"><img src="https://badges.treedom.net/badge/f/treedom-open-source?utm_source=github" alt="plant-a-tree" border="0" /></a>

An undici-based client for [Open Policy Agent](https://www.openpolicyagent.org/).

__Made with ❤️ at&nbsp;&nbsp;[<img src="https://assets.treedom.net/image/upload/manual_uploads/treedom-logo-contrib_gjrzt6.png" height="24" alt="Treedom" border="0" align="top" />](#-join-us-in-making-a-difference-)__, [join us in making a difference](#-join-us-in-making-a-difference-)!

## Install

```bash
npm install @treedom/opa-client-sdk
```

## Quickstart

```ts
import { OpenPolicyAgentClient } from '@treedom/opa-client-sdk';
import { LRUCache } from 'lru-cache'

const cache = new LRUCache();

const opaClient = new OpenPolicyAgentClient({
  url: 'https://my-opa.example.com',
  cache?: Cache // optional
  opaVersion?: string // defaults to 'v1'
  method?: 'POST' | 'GET' // defaults to 'POST'
})
```

## Usage

The `OpenPolicyAgentClient` class provides three methods: `evaluate`, `assert`, and `query`.

- All methods take the policy name and input as arguments. When specified, the input is expected to be an object.
- All the keys in the input object are optional; some frequently used keys, like `subject`, `resource`, and `headers`, are typed for convenience in `OpaQueryInput`.
- All the methods support generic types allowing customization when needed.
- Using the provided configuration, the client will make a request to the OPA server on `/{opaVersion}/data/{policyName}`.

#### Evaluate

The `evaluate` method returns the result of the policy evaluation. Throws only when the evaluation fails, following a network error for example. The policy is expected to return an object with a `result` key: `{ result: boolean }`.

```ts
await opaClient.evaluate(
  'data.my.policy.package', // Policy name
  { // Input
    subject: {
      id: '123',
      type: 'user'
    },
    resource: {
      id: '456',
      type: 'document'
    },
    headers: {
      authorization: 'Bearer token'
    }
  }
) // Returns a boolean
```

#### Assert

The `assert` method throws an error if the response does not match the expected value.

```ts
await opaClient.assert(
  'data.my.policy.package', // Policy name
  { // Input
    subject: {
      id: '123',
      type: 'user'
    },
    resource: {
      id: '456',
      type: 'document'
    },
    headers: {
      authorization: 'Bearer token'
    }
  },
  true // Expected value
) // Returns void
```

#### Query

The `query` method makes a direct call to the OPA server and returns the raw body, or throws an error if the query fails (status code different from 200).

```ts

const { result } = await opaClient.query(
  'data.my.policy.package', // Policy name
  { // Input
    subject: {
      id: '123',
      type: 'user'
    },
    resource: {
      id: '456',
      type: 'document'
    },
    headers: {
      authorization: 'Bearer token'
    }
  }
) // Returns an object
```

## 🌳 Join Us in Making a Difference! 🌳

We invite all developers who use Treedom's open-source code to support our mission of sustainability by planting a tree with us. By contributing to reforestation efforts, you help create a healthier planet and give back to the environment. Visit our [Treedom Open Source Forest](https://www.treedom.net/en/organization/treedom/event/treedom-open-source) to plant your tree today and join our community of eco-conscious developers.

Additionally, you can integrate the Treedom GitHub badge into your repository to showcase the number of trees in your Treedom forest and encourage others to plant new ones. Check out our [integration guide](https://github.com/treedomtrees/.github/blob/main/TREEDOM_BADGE.md) to get started.

Together, we can make a lasting impact! 🌍💚

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.

## License

This project is licensed under the MIT License.