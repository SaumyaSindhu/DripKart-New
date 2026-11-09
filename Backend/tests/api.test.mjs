import { stopMemoryDb } from './setup.mjs'
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import mongoose from 'mongoose'

const { default: app } = await import('../src/app.js')
const { default: userModel } = await import('../src/models/user.model.js')
const { default: productModel } = await import('../src/models/product.model.js')
const { default: cartModel } = await import('../src/models/cart.model.js')
const { default: paymentModel } = await import('../src/models/payment.model.js')

let server, base

// tiny HTTP client with a cookie jar (one per "browser")
const client = () => {
    let cookie = ''
    return {
        async req(method, path, { json, form, headers = {} } = {}) {
            const h = { ...headers }
            if (cookie) h.cookie = cookie
            let body
            if (json) { h['content-type'] = 'application/json'; body = JSON.stringify(json) }
            if (form) body = form
            const res = await fetch(base + path, { method, headers: h, body, redirect: 'manual' })
            const set = res.headers.getSetCookie?.() || []
            for (const c of set) {
                const [ pair ] = c.split(';')
                if (pair.startsWith('token=') && pair === 'token=') cookie = ''
                else if (pair.startsWith('token=')) cookie = pair
            }
            let data = null
            const text = await res.text()
            try { data = JSON.parse(text) } catch { data = text }
            return { status: res.status, data, headers: res.headers }
        }
    }
}

before(async () => {
    await mongoose.connect(process.env.MONGO_URI)
    // SAFETY: this suite wipes the database, so it only runs on a database whose name ends in "_test"
    if (!mongoose.connection.name.endsWith('_test')) {
        throw new Error(`Refusing to run: database "${mongoose.connection.name}" does not end in "_test"`)
    }
    await mongoose.connection.dropDatabase()
    await new Promise(r => { server = app.listen(0, r) })
    base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
    await new Promise(r => server.close(r))
    await mongoose.disconnect()
    await stopMemoryDb()
})

const buyerInfo = { email: 'buyer@test.com', contact: '9876543210', password: 'secret123', fullname: 'Test Buyer', isSeller: false }
const sellerInfo = { email: 'seller@test.com', contact: '9123456780', password: 'secret123', fullname: 'Test Seller', isSeller: true }

const buyer = client()
const seller = client()
const ids = {}

describe('AUTH', () => {
    test('register buyer -> 200, sets cookie, role buyer', async () => {
        const r = await buyer.req('POST', '/api/auth/register', { json: buyerInfo })
        assert.equal(r.status, 200)
        assert.equal(r.data.user.role, 'buyer')
        assert.ok(r.headers.getSetCookie().some(c => c.startsWith('token=')))
    })
    test('register seller -> role seller', async () => {
        const r = await seller.req('POST', '/api/auth/register', { json: sellerInfo })
        assert.equal(r.status, 200)
        assert.equal(r.data.user.role, 'seller')
    })
    test('register duplicate email -> 400 with message', async () => {
        const r = await client().req('POST', '/api/auth/register', { json: buyerInfo })
        assert.equal(r.status, 400)
        assert.match(r.data.message, /already exists/)
    })
    test('register bad contact -> 400 validator errors', async () => {
        const r = await client().req('POST', '/api/auth/register', { json: { ...buyerInfo, email: 'x@y.com', contact: '123' } })
        assert.equal(r.status, 400)
        assert.ok(r.data.errors.some(e => /10-digit/.test(e.msg)))
    })
    test('login wrong password -> 400 Invalid email or password', async () => {
        const r = await client().req('POST', '/api/auth/login', { json: { email: buyerInfo.email, password: 'nope' } })
        assert.equal(r.status, 400)
        assert.equal(r.data.message, 'Invalid email or password')
    })
    test('login unknown email -> 400 same message', async () => {
        const r = await client().req('POST', '/api/auth/login', { json: { email: 'ghost@test.com', password: 'whatever' } })
        assert.equal(r.status, 400)
        assert.equal(r.data.message, 'Invalid email or password')
    })
    test('login ok, /me returns the user, logout clears the session', async () => {
        const c = client()
        const l = await c.req('POST', '/api/auth/login', { json: { email: buyerInfo.email, password: buyerInfo.password } })
        assert.equal(l.status, 200)
        const me = await c.req('GET', '/api/auth/me')
        assert.equal(me.status, 200)
        assert.equal(me.data.user.email, buyerInfo.email)
        await c.req('POST', '/api/auth/logout')
        const me2 = await c.req('GET', '/api/auth/me')
        assert.equal(me2.status, 401)
    })
    test('/me without cookie -> 401', async () => {
        assert.equal((await client().req('GET', '/api/auth/me')).status, 401)
    })
    test('password response never leaks the hash', async () => {
        const r = await client().req('POST', '/api/auth/login', { json: { email: buyerInfo.email, password: buyerInfo.password } })
        assert.equal(JSON.stringify(r.data).includes('password'), false)
    })
    test('Google-only account trying password login -> should be a clean 400 (not a crash)', async () => {
        await userModel.create({ email: 'g@test.com', fullname: 'Google User', googleId: 'g123' })
        const r = await client().req('POST', '/api/auth/login', { json: { email: 'g@test.com', password: 'anything' } })
        assert.equal(r.status, 400, `got ${r.status}`)
    })
})

describe('PRODUCTS', () => {
    test('buyer cannot use seller routes -> 403', async () => {
        const r = await buyer.req('GET', '/api/products/seller')
        assert.equal(r.status, 403)
    })
    test('anonymous cannot create product -> 401', async () => {
        assert.equal((await client().req('POST', '/api/products/')).status, 401)
    })
    test('seller create product validation -> 400 when title missing', async () => {
        const f = new FormData(); f.append('description', 'd'); f.append('priceAmount', '1299'); f.append('priceCurrency', 'INR')
        const r = await seller.req('POST', '/api/products/', { form: f })
        assert.equal(r.status, 400)
    })
    test('seller creates product (no images) -> 201', async () => {
        const f = new FormData()
        f.append('title', 'Double Cuff Maroon Shirt'); f.append('description', 'A shirt'); f.append('priceAmount', '1299'); f.append('priceCurrency', 'INR')
        const r = await seller.req('POST', '/api/products/', { form: f })
        assert.equal(r.status, 201, JSON.stringify(r.data))
        ids.product = r.data.product._id
    })
    test('add variants: M (inherits base price) and L (own price 1499)', async () => {
        const mk = (size, stock, price) => { const f = new FormData(); f.append('attributes', JSON.stringify({ Size: size, Color: 'Maroon' })); f.append('stock', String(stock)); if (price) f.append('priceAmount', String(price)); return f }
        const m = await seller.req('POST', `/api/products/${ids.product}/variants`, { form: mk('M', 5) })
        assert.equal(m.status, 200, JSON.stringify(m.data))
        const l = await seller.req('POST', `/api/products/${ids.product}/variants`, { form: mk('L', 2, 1499) })
        assert.equal(l.status, 200)
        const p = l.data.product
        assert.equal(p.variants.length, 2)
        assert.equal(p.variants[0].price.amount, 1299, 'variant without price should inherit the base price')
        assert.equal(p.variants[1].price.amount, 1499)
        ids.vM = p.variants[0]._id; ids.vL = p.variants[1]._id
        // an out-of-stock variant for later
        const z = await seller.req('POST', `/api/products/${ids.product}/variants`, { form: mk('XL', 0) })
        ids.vXL = z.data.product.variants[2]._id
    })
    test('public list + detail', async () => {
        const list = await client().req('GET', '/api/products/')
        assert.equal(list.status, 200)
        assert.equal(list.data.products.length, 1)
        const d = await client().req('GET', `/api/products/detail/${ids.product}`)
        assert.equal(d.status, 200)
        assert.equal(d.data.product.variants[0].attributes.Size, 'M')
    })
    test('detail of unknown (valid) id -> 404', async () => {
        const r = await client().req('GET', `/api/products/detail/${new mongoose.Types.ObjectId()}`)
        assert.equal(r.status, 404)
    })
    test('detail with a malformed id -> should be 4xx, not 500', async () => {
        const r = await client().req('GET', '/api/products/detail/not-an-id')
        assert.ok(r.status >= 400 && r.status < 500, `got ${r.status}`)
    })
    test('variant with malformed attributes JSON -> should be 400, not 500', async () => {
        const f = new FormData(); f.append('attributes', '{bad json'); f.append('stock', '1')
        const r = await seller.req('POST', `/api/products/${ids.product}/variants`, { form: f })
        assert.equal(r.status, 400, `got ${r.status}`)
    })
})

describe('CART', () => {
    const add = (v, body) => buyer.req('POST', `/api/cart/add/${ids.product}/${v}`, body ? { json: body } : { json: {} })
    const getCart = async () => (await buyer.req('GET', '/api/cart/')).data.cart

    test('cart routes need login -> 401', async () => {
        assert.equal((await client().req('GET', '/api/cart/')).status, 401)
        assert.equal((await client().req('POST', `/api/cart/add/${ids.product}/${ids.vM}`)).status, 401)
    })
    test('empty cart fetch -> 200 with no items', async () => {
        const c = await getCart()
        assert.equal(c.items.length, 0)
    })
    test('add M twice -> quantity 2', async () => {
        assert.equal((await add(ids.vM)).status, 200)
        assert.equal((await add(ids.vM)).status, 200)
        const c = await getCart()
        assert.equal(c.items.length, 1)
        assert.equal(c.items[0].quantity, 2)
        assert.equal(c.totalPrice, 2 * 1299)
    })
    test('adding beyond stock -> 400 with message', async () => {
        const r = await add(ids.vM, { quantity: 10 })
        assert.equal(r.status, 400)
        assert.match(r.data.message, /left in stock/)
    })
    test('add out-of-stock variant -> 400', async () => {
        assert.equal((await add(ids.vXL)).status, 400)
    })
    test('invalid quantity / ids -> 400 (validator)', async () => {
        assert.equal((await add(ids.vM, { quantity: 0 })).status, 400)
        assert.equal((await buyer.req('POST', `/api/cart/add/xyz/${ids.vM}`, { json: {} })).status, 400)
    })
    test('add L (variant with its own price) -> total uses variant price', async () => {
        assert.equal((await add(ids.vL)).status, 200)
        const c = await getCart()
        assert.equal(c.items.length, 2)
        assert.equal(c.totalPrice, 2 * 1299 + 1499)
    })
    test('cart item price snapshot equals the variant price (not the base price)', async () => {
        const c = await getCart()
        const l = c.items.find(i => i.variant === ids.vL)
        assert.equal(l.price.amount, 1499, `snapshot is ${l.price.amount}, variant price is 1499`)
    })
    test('increment works and updates the total', async () => {
        const r = await buyer.req('PATCH', `/api/cart/quantity/increment/${ids.product}/${ids.vM}`)
        assert.equal(r.status, 200)
        const c = await getCart()
        assert.equal(c.items.find(i => i.variant === ids.vM).quantity, 3)
        assert.equal(c.totalPrice, 3 * 1299 + 1499)
    })
    test('increment past stock -> 400', async () => {
        await buyer.req('PATCH', `/api/cart/quantity/increment/${ids.product}/${ids.vM}`)
        await buyer.req('PATCH', `/api/cart/quantity/increment/${ids.product}/${ids.vM}`)  // 5 (= stock)
        const r = await buyer.req('PATCH', `/api/cart/quantity/increment/${ids.product}/${ids.vM}`)
        assert.equal(r.status, 400)
    })
    test('decrement works down to 1, then refuses', async () => {
        for (let i = 0; i < 4; i++) assert.equal((await buyer.req('PATCH', `/api/cart/quantity/decrement/${ids.product}/${ids.vM}`)).status, 200)
        const c = await getCart()
        assert.equal(c.items.find(i => i.variant === ids.vM).quantity, 1)
        const r = await buyer.req('PATCH', `/api/cart/quantity/decrement/${ids.product}/${ids.vM}`)
        assert.equal(r.status, 400)
    })
    test("one user's cart is not affected by another user's actions", async () => {
        const other = client()
        await other.req('POST', '/api/auth/register', { json: { ...buyerInfo, email: 'other@test.com', contact: '9000000001' } })
        const r = await other.req('DELETE', `/api/cart/item/${ids.product}/${ids.vM}`)
        assert.ok([ 200, 404 ].includes(r.status))
        const c = await getCart()
        assert.equal(c.items.length, 2)
    })
    test('CORS preflight allows PATCH (needed if the frontend ever calls the API cross-origin)', async () => {
        const r = await client().req('OPTIONS', `/api/cart/quantity/increment/${ids.product}/${ids.vM}`, { headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'PATCH' } })
        const allowed = r.headers.get('access-control-allow-methods') || ''
        assert.match(allowed, /PATCH/, `allowed methods: "${allowed}"`)
    })
    test('remove one variant keeps the other; removing the last empties the cart without duplicating cart docs', async () => {
        assert.equal((await buyer.req('DELETE', `/api/cart/item/${ids.product}/${ids.vL}`)).status, 200)
        let c = await getCart()
        assert.equal(c.items.length, 1)
        assert.equal((await buyer.req('DELETE', `/api/cart/item/${ids.product}/${ids.vM}`)).status, 200)
        c = await getCart()
        assert.equal(c.items.length, 0)
        await getCart(); await getCart()
        const u = await userModel.findOne({ email: buyerInfo.email })
        assert.equal(await cartModel.countDocuments({ user: u._id }), 1)
    })
    test('remove with invalid ids -> 400', async () => {
        assert.equal((await buyer.req('DELETE', '/api/cart/item/abc/def')).status, 400)
    })
})

describe('PAYMENTS', () => {
    const sign = (orderId, paymentId) => crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex')
    let cartOrder, buyNowOrder

    test('checkout with an empty cart -> 400', async () => {
        const r = await buyer.req('POST', '/api/cart/payment/create/order')
        assert.equal(r.status, 400)
    })
    test('cart checkout creates a pending payment with the right amount', async () => {
        await buyer.req('POST', `/api/cart/add/${ids.product}/${ids.vM}`, { json: { quantity: 2 } })
        await buyer.req('POST', `/api/cart/add/${ids.product}/${ids.vL}`, { json: {} })
        const r = await buyer.req('POST', '/api/cart/payment/create/order')
        assert.equal(r.status, 200, JSON.stringify(r.data))
        cartOrder = r.data.order
        assert.equal(cartOrder.amount, (2 * 1299 + 1499) * 100)
        const p = await paymentModel.findOne({ 'razorpay.orderId': cartOrder.id })
        assert.equal(p.status, 'pending')
        assert.equal(p.orderItems.length, 2)
    })
    test('buy now: creates a one-item payment at the variant price and leaves the cart alone', async () => {
        const before = (await buyer.req('GET', '/api/cart/')).data.cart.items.length
        const r = await buyer.req('POST', `/api/cart/payment/create/buy-now/${ids.product}/${ids.vL}`)
        assert.equal(r.status, 200, JSON.stringify(r.data))
        buyNowOrder = r.data.order
        assert.equal(buyNowOrder.amount, 1499 * 100)
        const p = await paymentModel.findOne({ 'razorpay.orderId': buyNowOrder.id })
        assert.equal(p.orderItems.length, 1)
        assert.equal(p.orderItems[0].quantity, 1)
        assert.equal((await buyer.req('GET', '/api/cart/')).data.cart.items.length, before)
    })
    test('buy now: out of stock -> 400, unknown variant -> 404, bad id -> 400, anonymous -> 401', async () => {
        assert.equal((await buyer.req('POST', `/api/cart/payment/create/buy-now/${ids.product}/${ids.vXL}`)).status, 400)
        assert.equal((await buyer.req('POST', `/api/cart/payment/create/buy-now/${ids.product}/${new mongoose.Types.ObjectId()}`)).status, 404)
        assert.equal((await buyer.req('POST', `/api/cart/payment/create/buy-now/${ids.product}/zzz`)).status, 400)
        assert.equal((await client().req('POST', `/api/cart/payment/create/buy-now/${ids.product}/${ids.vL}`)).status, 401)
    })
    test('verify: forged signature -> 400 and payment marked failed', async () => {
        const r = await buyer.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: cartOrder.id, razorpay_payment_id: 'pay_1', razorpay_signature: 'deadbeef' } })
        assert.equal(r.status, 400)
        const p = await paymentModel.findOne({ 'razorpay.orderId': cartOrder.id })
        assert.equal(p.status, 'failed')
    })
    test('verify: valid signature -> paid, and replaying it is rejected', async () => {
        const ok = await buyer.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: buyNowOrder.id, razorpay_payment_id: 'pay_2', razorpay_signature: sign(buyNowOrder.id, 'pay_2') } })
        assert.equal(ok.status, 200)
        const p = await paymentModel.findOne({ 'razorpay.orderId': buyNowOrder.id })
        assert.equal(p.status, 'paid')
        const again = await buyer.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: buyNowOrder.id, razorpay_payment_id: 'pay_2', razorpay_signature: sign(buyNowOrder.id, 'pay_2') } })
        assert.equal(again.status, 400)
    })
    test('after a paid purchase the variant stock should go down', async () => {
        const p = await productModel.findById(ids.product)
        const L = p.variants.id(ids.vL)
        assert.equal(L.stock, 1, `stock is still ${L.stock} (was 2, one unit was bought)`)
    })
    test('after a paid CART purchase the cart should be emptied', async () => {
        // pay the cart order properly (fresh one, the first was marked failed above)
        const o = (await buyer.req('POST', '/api/cart/payment/create/order')).data.order
        const v = await buyer.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: o.id, razorpay_payment_id: 'pay_3', razorpay_signature: sign(o.id, 'pay_3') } })
        assert.equal(v.status, 200)
        const c = (await buyer.req('GET', '/api/cart/')).data.cart
        assert.equal(c.items.length, 0, `cart still has ${c.items.length} item(s) after payment`)
    })
})

// Precise, isolated checks of what payment verification does to stock and the cart.
// (Each test uses its own product so earlier tests cannot influence the numbers.)
describe('PAYMENT SIDE EFFECTS (isolated)', () => {
    const sign = (o, p) => crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${o}|${p}`).digest('hex')
    const shopper = client()
    let prod, variant

    const stockNow = async () => (await productModel.findById(prod)).variants.id(variant).stock
    const cartNow = async () => (await shopper.req('GET', '/api/cart/')).data.cart.items

    before(async () => {
        await shopper.req('POST', '/api/auth/register', { json: { ...buyerInfo, email: 'iso@test.com', contact: '9000000077' } })
        const f = new FormData(); f.append('title', 'Isolated Tee'); f.append('description', 'd'); f.append('priceAmount', '1000'); f.append('priceCurrency', 'INR')
        prod = (await seller.req('POST', '/api/products/', { form: f })).data.product._id
        const v = new FormData(); v.append('attributes', JSON.stringify({ Size: 'M', Color: 'Black' })); v.append('stock', '10')
        variant = (await seller.req('POST', `/api/products/${prod}/variants`, { form: v })).data.product.variants[0]._id
    })

    test('a FORGED verification must not change stock or empty the cart', async () => {
        await shopper.req('POST', `/api/cart/add/${prod}/${variant}`, { json: { quantity: 2 } })
        const o = (await shopper.req('POST', '/api/cart/payment/create/order')).data.order
        const r = await shopper.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: o.id, razorpay_payment_id: 'pay_x', razorpay_signature: 'forged' } })
        assert.equal(r.status, 400)
        assert.equal(await stockNow(), 10, 'stock changed even though the payment was never made')
        assert.equal((await cartNow()).length, 1, 'cart was emptied even though the payment was never made')
    })

    test('a VALID cart payment reduces stock by exactly the quantity bought and empties the cart', async () => {
        const o = (await shopper.req('POST', '/api/cart/payment/create/order')).data.order
        const r = await shopper.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: o.id, razorpay_payment_id: 'pay_ok', razorpay_signature: sign(o.id, 'pay_ok') } })
        assert.equal(r.status, 200)
        assert.equal(await stockNow(), 8, `stock should be 10 - 2 = 8, it is ${await stockNow()}`)
        assert.equal((await cartNow()).length, 0, 'cart should be empty after a paid cart order')
    })

    test('a VALID buy-now payment reduces stock by 1 and leaves the cart alone', async () => {
        await shopper.req('POST', `/api/cart/add/${prod}/${variant}`, { json: { quantity: 1 } })
        const o = (await shopper.req('POST', `/api/cart/payment/create/buy-now/${prod}/${variant}`)).data.order
        const r = await shopper.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: o.id, razorpay_payment_id: 'pay_bn', razorpay_signature: sign(o.id, 'pay_bn') } })
        assert.equal(r.status, 200)
        assert.equal(await stockNow(), 7)
        assert.equal((await cartNow()).length, 1, 'buy-now must not touch the cart')
    })
})

describe('PAYMENT SAFETY', () => {
    const sign = (o, p) => crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${o}|${p}`).digest('hex')
    const owner = client(), stranger = client()
    let prod, variant

    before(async () => {
        await owner.req('POST', '/api/auth/register', { json: { ...buyerInfo, email: 'own@test.com', contact: '9000000088' } })
        await stranger.req('POST', '/api/auth/register', { json: { ...buyerInfo, email: 'str@test.com', contact: '9000000089' } })
        const f = new FormData(); f.append('title', 'Safety Tee'); f.append('description', 'd'); f.append('priceAmount', '500'); f.append('priceCurrency', 'INR')
        prod = (await seller.req('POST', '/api/products/', { form: f })).data.product._id
        const v = new FormData(); v.append('attributes', JSON.stringify({ Size: 'M' })); v.append('stock', '10')
        variant = (await seller.req('POST', `/api/products/${prod}/variants`, { form: v })).data.product.variants[0]._id
    })

    test("another user cannot fail or complete someone else's pending order", async () => {
        const o = (await owner.req('POST', `/api/cart/payment/create/buy-now/${prod}/${variant}`)).data.order
        const bad = await stranger.req('POST', '/api/cart/payment/verify/order', { json: { razorpay_order_id: o.id, razorpay_payment_id: 'pay_s', razorpay_signature: 'forged' } })
        assert.equal(bad.status, 400)
        const p = await paymentModel.findOne({ 'razorpay.orderId': o.id })
        assert.equal(p.status, 'pending', "a stranger changed the owner's payment")
    })

    test('verifying the same payment twice at the same time reduces stock only once', async () => {
        const o = (await owner.req('POST', `/api/cart/payment/create/buy-now/${prod}/${variant}`)).data.order
        const body = { razorpay_order_id: o.id, razorpay_payment_id: 'pay_d', razorpay_signature: sign(o.id, 'pay_d') }
        const [ a, b ] = await Promise.all([
            owner.req('POST', '/api/cart/payment/verify/order', { json: body }),
            owner.req('POST', '/api/cart/payment/verify/order', { json: body }),
        ])
        assert.deepEqual([ a.status, b.status ].sort(), [ 200, 400 ])
        const stock = (await productModel.findById(prod)).variants.id(variant).stock
        assert.equal(stock, 9, `stock should be 10 - 1 = 9, it is ${stock}`)
    })
})
