import plugin from "fastify-plugin"
import Cookie from "cookie"
import assert, { is_string } from "./assert"
import assign from "./lib/assign"
import { sha256 } from "js-sha256"
import { ObjectID } from "mongodb"
import config from "./config/beluga"

let websocket = null
if (config.https) {
    const fs = require("fs")
    websocket = require("fastify")({
        "https": {
            "key": fs.readFileSync(config.websocket.https.key),
            "cert": fs.readFileSync(config.websocket.https.cert)
        }
    })
} else {
    websocket = require("fastify")()
}

const get_server_name = url => {
    const components = url.split("/")
    const location = components[1]
    if (location === "server") {
        return components[2]
    }
    return null
}

class OnlineManager {
    constructor() {
        this.users = new Set()
        this.users_on_server = {}
    }
    total() {
        return this.users.size
    }
    clear() {
        this.users.clear()
        this.users_on_server = {}
    }
    remove(url, user_id) {
        const server_name = get_server_name(url)
        if (!!server_name == false) {
            return false
        }
        if (!!(server_name in this.users_on_server) === false) {
            return false
        }
        const users = this.users_on_server[server_name]
        if (!!(user_id in users) === false) {
            return false
        }
        users[user_id] -= 1
        if (users[user_id] <= 0) {
            delete users[user_id]
            return true
        }
        return false
    }
    register(url, user_id) {
        if (this.users.has(user_id) == false) {
            this.users.add(user_id)
        }
        const server_name = get_server_name(url)
        if (!!server_name === false) {
            return
        }
        if (!!(server_name in this.users_on_server) === false) {
            this.users_on_server[server_name] = {}
        }
        const users = this.users_on_server[server_name]
        if (!!(user_id in users) === false) {
            users[user_id] = 0
        }
        users[user_id] += 1
    }
}

class WebsocketBridge {
    get_users_by_server(server) {
        if (!!server === false) {
            return []
        }
        if (!!server.name === false) {
            return []
        }
        if (!!(server.name in online.users_on_server) === false) {
            return []
        }
        const user_ids = []
        for (const user_id in online.users_on_server[server.name]) {	// 辞書なのでキーだけ取り出す
            user_ids.push(user_id)
        }
        return user_ids
    }
}

const online = new OnlineManager()

const authenticate = async (websocket, headers) => {
    const { access_token, access_token_secret, cookie } = headers
    if (is_string(access_token) && is_string(access_token_secret)) {
        return await websocket.authenticate_access_token(access_token, access_token_secret)
    }
    if (is_string(cookie)) {
        return await websocket.authenticate_cookie(Cookie.parse(cookie))
    }
    return null
}

const broadcast = (event, data) => {
    if (websocket.ws === undefined) {
        return
    }
    websocket.ws.clients.forEach(client => {
        if (client.readyState != client.OPEN) {
            return
        }
        client.send(JSON.stringify(Object.assign({
            [event]: true	// イベント名をそのままキーにする
        }, data)))
    })
}

const update_online_members = () => {
    if (websocket.ws === undefined) {
        return
    }

    // 全て消去
    online.clear()

    // 再追加
    const clients = []
    websocket.ws.clients.forEach(client => {
        if (!!client.user_id === false) {
            return
        }
        if (client.readyState != client.OPEN) {
            return
        }
        clients.push(client)
    })
    // 来た時刻で昇順になるようにソート
    clients.sort((a, b) => {
        if (a.arrived_at < b.arrived_at) {
            return -1
        }
        if (a.arrived_at > b.arrived_at) {
            return 1
        }
        return 0
    })
    clients.forEach(client => {
        online.register(client.url, client.user_id)
    })
    broadcast("online_members_changed", { "count": online.total() })		// 全員に通知
}

websocket
    .register(plugin((fastify, opts, next) => {
        const WebSocketServer = require("ws").Server
        const wss = new WebSocketServer({
            server: fastify.server
        })
        fastify.decorate("ws", wss)
        fastify.addHook("onClose", (fastify, done) => fastify.ws.close(done))
        next()
    }))
    .after(() => {
        websocket.ws
            .on("connection", async (client, req) => {		// ユーザーが接続するたびに呼ばれる
                const { url, headers } = req
                // const headers = assign(req.headers)	// なぜか消えたりするのでコピー
                const session = await authenticate(websocket, headers)
                if (session === null) {
                    return
                }
                let { user_id } = session
                if (user_id instanceof ObjectID) {
                    user_id = user_id.toHexString()
                }
                if (is_string(user_id) === false) {
                    return
                }
                client.url = url
                client.user_id = user_id
                client.arrived_at = Date.now()
                // client.is_alive = true
                // client.on("pong", function () {
                //     this.is_alive = true
                // })
                client.on("close", function () {
                    const did_disappear = online.remove(this.url, this.user_id)	// サーバーとユーザーの関連付け
                    if (did_disappear) {
                        update_online_members()
                    }
                })
                update_online_members()
            })

        const interval = setInterval(() => {
            // // pingを送信
            // websocket.ws.clients.forEach(client => {
            //     if (client.is_alive === false) {
            //         return client.terminate()
            //     }
            //     client.is_alive = false
            //     client.ping("", false, true)
            // })
            update_online_members()
        }, 30000)
    })

// 各サーバーのオンライン中のユーザーの管理を行う
const bridge = (fastify, options, next) => {
    fastify.decorate("websocket_bridge", new WebsocketBridge())
    fastify.decorate("websocket_broadcast", broadcast)
    next()
}

exports.websocket = websocket
exports.bridge = plugin(bridge)