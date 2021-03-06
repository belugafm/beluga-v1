import plugin from "fastify-plugin"
import signature from "cookie-signature"
import { sync as uid } from "uid-safe"
import Session from "./session"
import Store from "./store"
import assert, { is_string, is_object } from "../../assert"

const is_undefined = value => {
    return typeof value === "undefined"
}

module.exports = plugin((fastify, options, next) => {
    if (!fastify.mongo) {
        throw new Error("MongoDB not found.")
    }
    const db = fastify.mongo.db
    const store = new Store(db)
    const cookie_name = options.cookie_name || "session_id"
    const secret = options.secret
    const timezone_offset = options.timezone_offset
    const _cookie_options = options.cookie_options || {}

    if (!!secret === false) {
        next(new Error("secret option is required!"))
        return
    }
    if (!!_cookie_options.max_age === false) {
        next(new Error("max_age option is required!"))
        return
    }

    // 期限切れのセッションを削除
    setInterval(() => {
        store.clean()
    }, 3600 * 1000)

    const get_session_by = async encrypted_session_id => {
        if (typeof encrypted_session_id !== "string") {
            return null
        }
        const session = await store.get(encrypted_session_id)
        if (session === null) {
            return null
        }
        const session_id = signature.unsign(`${session.id}.${encrypted_session_id}`, secret)
        if (session_id === false) {
            return null
        }
        if (session_id !== session.id) {
            return null
        }
        return session
    }
    const start_session = async (request, reply) => {
        const url = request.req.url
        if (url.indexOf(_cookie_options.path || "/") !== 0) {
            return null
        }
        const encrypted_session_id = request.cookies[cookie_name]
        // console.log("cookie", encrypted_session_id)
        if (typeof encrypted_session_id !== "string") {
            // console.log(1)
            return await start_anonymous_session(request, reply, secret)
        }
        const session = await store.get(encrypted_session_id)
        if (session === null) {
            // console.log(2)
            return await start_anonymous_session(request, reply, secret)
        }
        const session_id = signature.unsign(`${session.id}.${encrypted_session_id}`, secret)
        if (session_id === false) {
            // console.log(3)
            return await start_anonymous_session(request, reply, secret)
        }
        if (session_id !== session.id) {
            // console.log(4)
            return await start_anonymous_session(request, reply, secret)
        }
        return session
    }
    const start_anonymous_session = async (request, reply, secret) => {
        const ip_address = request.headers["x-real-ip"]
        const user_agent = request.headers["user-agent"] || null
        assert(is_string(ip_address), "$ip_address must be of type string")
        const session = generate_session(ip_address, user_agent)
        await store.save(session)
        const options = get_cookie_options()
        // console.log("options", options)
        // console.log(cookie_name, session.encrypted_id)
        reply.setCookie(cookie_name, session.encrypted_id, options)
        return session
    }
    const generate_session = (ip_address, user_agent) => {
        const session_id = uid(24)
        const encrypted_session_id = signature.sign(session_id, secret).split(".")[1]
        const expires = Date.now() + _cookie_options.max_age * 1000
        return new Session(session_id, encrypted_session_id, null, expires, ip_address, user_agent)
    }
    const destroy_session = async (encrypted_id, reply) => {
        await store.destroy(encrypted_id)
        const options = get_cookie_options()
        reply.setCookie(cookie_name, encrypted_id, Object.assign({}, options, {
            "expires": 0
        }))
        return true
    }
    const get_cookie_options = () => {
        return {
            "path": is_undefined(_cookie_options.path) ? "/" : _cookie_options.path,
            "httpOnly": is_undefined(_cookie_options.http_only) ? true : _cookie_options.http_only,
            "secure": is_undefined(_cookie_options.secure) ? true : _cookie_options.secure,
            "expires": get_expires(_cookie_options),
            "sameSite": is_undefined(_cookie_options.same_site) ? false : _cookie_options.same_site,
            "domain": is_undefined(_cookie_options.domain) ? null : _cookie_options.domain,
        }
    }
    const get_expires = () => {
        let expires = null
        if (_cookie_options.expires) {
            expires = _cookie_options.expires
        } else if (_cookie_options.max_age) {
            expires = new Date(Date.now() + (_cookie_options.max_age + timezone_offset) * 1000)	// Date.now()はミリ秒
        }
        return expires
    }
    class SessionManager {
        async generate(request, reply, user_id) {
            const ip_address = request.headers["x-real-ip"]
            const user_agent = request.headers["user-agent"] || null
            assert(is_string(ip_address), "$ip_address must be of type string")
            const session = generate_session(ip_address)
            session.user_id = user_id
            await store.save(session)
            const options = get_cookie_options()
            reply.setCookie(cookie_name, session.encrypted_id, options)
            return session
        }
        async destroy(session, reply) {
            assert(is_object(session), "$session must be of type object")
            return await destroy_session(session.encrypted_id, reply)
        }
        async start(request, reply) {
            return await start_session(request, reply)
        }
        async get(encrypted_id) {
            if (typeof encrypted_id !== "string") {
                return null
            }
            return await get_session_by(encrypted_id)
        }
    }
    fastify.decorate("session", new SessionManager())
    next()
})