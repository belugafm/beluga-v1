"use strict"
import mongodb from "mongodb"
import plugin from "fastify-plugin"
import { websocket, bridge } from "./websocket"
import mongo from "./mongo"
import config from "./config/beluga"
const app = require("fastify")({
    "bodyLimit": 1024 * 1024 * 10,
    "maxParamLength": config.channel.max_name_length * 10
})

function check_heap_size() {

    // gc.
    try {
        global.gc();
    } catch (e) {
        console.log('You have to run this program as `node --expose-gc app_memory_leak.js`');
        process.exit();
    }

    // Check heap memory.
    const heapUsed = process.memoryUsage().heapUsed;
    console.log('heapSize: ', heapUsed);
}

// setInterval(check_heap_size, 1000);

mongodb.MongoClient
    .connect(mongo.url)
    .then(client => {
        app
            .register(require("fastify-mongodb"), {
                client,
                "database": mongo.database.production
            })
            .register(require("./cookie"))
            .register(require("./auth/cookie"), {
                "secret": config.auth.session.cookie_secret,
                "cookie_name": config.auth.session.cookie_name,
                "timezone_offset": config.auth.session.timezone_offset,
                "cookie_options": {
                    "http_only": false,
                    "same_site": false,
                    "secure": config.auth.session.secure,
                    "max_age": config.auth.session.max_age,
                }
            })
            .register(require("./auth/plugin"))
            .register(bridge)
            .register(require("./routes/api"))
            .register(require("fastify-nextjs"))

        app.after(() => {
            app.register(require("./routes/client"))
        })

        app.listen(config.port.app, (error) => {
            if (error) {
                throw error
            }
        })

        websocket.register(plugin((fastify, options, next) => {
            fastify.decorate("authenticate_cookie", async cookie => {
                if (typeof cookie !== "object") {
                    return null
                }
                return await app.session.get(cookie[config.auth.session.cookie_name])
            })
            fastify.decorate("authenticate_access_token", async (access_token, access_token_secret) => {
                return await app.authenticate_access_token(access_token, access_token_secret)
            })
            next()
        }))
        websocket.listen(config.port.websocket, config.ip_address, (error) => {
            if (error) {
                console.log(error)
                throw error
            }
        })
    })
    .catch(error => {
        console.log(error)
        throw error
    })