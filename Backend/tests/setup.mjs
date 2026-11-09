// Test setup: env + fake Razorpay HTTP layer (no real network calls)
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.GOOGLE_CLIENT_ID = 'x'
process.env.GOOGLE_CLIENT_SECRET = 'x'
process.env.IMAGEKIT_PRIVATE_KEY = 'x'
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy'
process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_for_tests'
process.env.NODE_ENV = 'development'

// Database for the tests:
//   - if MONGO_URI is set, that database is used (its name must end in "_test")
//   - otherwise a throwaway in-memory MongoDB is started automatically, nothing to install
let memoryServer
if (!process.env.MONGO_URI) {
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    memoryServer = await MongoMemoryServer.create()
    process.env.MONGO_URI = memoryServer.getUri('dripkart_test')
}

export const stopMemoryDb = async () => {
    if (memoryServer) await memoryServer.stop()
}

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const axios = require(require.resolve('axios', { paths: [ require.resolve('razorpay') ] })).default

let n = 0
axios.defaults.adapter = async (config) => {
    const body = config.data ? JSON.parse(config.data) : {}
    return {
        status: 200, statusText: 'OK', headers: {}, config,
        data: { id: `order_test_${++n}`, entity: 'order', amount: body.amount, currency: body.currency, status: 'created' }
    }
}
