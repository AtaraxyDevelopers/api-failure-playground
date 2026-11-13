# API Failure Playground

[![CI](https://github.com/AtaraxyDevelopers/api-failure-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/AtaraxyDevelopers/api-failure-playground/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A local HTTP API for exercising slow, failed, expired, and rate-limited responses.

An open-source project from [Ataraxy Developers](https://github.com/AtaraxyDevelopers).

![Local demo](docs/preview.png)

## Quick start

Requires Node.js 22 or 24 and npm. Git is optional if you download the source ZIP.

```sh
git clone https://github.com/AtaraxyDevelopers/api-failure-playground.git
cd api-failure-playground
npm ci
npm test
```

```sh
npm start
```

Open **http://127.0.0.1:4310** for the local interactive demo. Or run `npm run demo`
for a self-contained command-line tour that starts and stops its own server.

## API

GET `/api/items?scenario=NAME` returns one of:

| Scenario        | Behavior                                         |
| --------------- | ------------------------------------------------ |
| success / empty | 200 with items / an empty list                   |
| slow            | 200 after a configurable delay (default 1500 ms) |
| unauthorized    | 401 with a Bearer challenge                      |
| rate-limit      | 429 with Retry-After: 2                          |
| server-error    | 503                                              |
| malformed       | 200 with intentionally invalid JSON              |
| flaky           | Two 503 responses, then one 200; repeats         |
| disconnect      | Closes the connection without a response         |

GET `/health` returns health and GET `/scenarios` lists the scenarios.
Unknown scenarios return 400; unsupported methods return 405.

```sh
npm start -- --port 4311 --delay 3000
```

## Scope and limitations

This is a development server bound to IPv4 loopback. It has no authentication and
must not be exposed as a production API. No CORS headers are added: use your
frontend development server's proxy to connect from another origin. Flaky state is
shared across clients and resets on restart. The rate-limit scenario always returns
429; Retry-After is an instruction for your client, not an automatic recovery timer.

## Validation

The HTTP integration test exercises every scenario, status codes, headers, delay,
malformed JSON, network failure, method rejection, and the demo document.

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md), [community expectations](CODE_OF_CONDUCT.md),
and [SECURITY.md](SECURITY.md). Open an issue with a minimal synthetic reproduction.
This project is maintained on a best-effort basis. No paid service or account is
required to run the local examples.

## License

[MIT](LICENSE). You may use, adapt, and redistribute this project under its license.
