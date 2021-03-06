import api from "../../../api"
import memcached from "../../../memcached"
import model from "../../../model"
import assign from "../../../lib/assign"
import { parse_bool_str } from "../../../lib/bool"

module.exports = (fastify, options, next) => {
    fastify.post("/api/v1/channel/create", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            const channel = await model.v1.channel.create(fastify.mongo.db, params)
            res.send({ "success": true, channel })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/channel/profile/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            const channel = await model.v1.channel.update(fastify.mongo.db, params)
            res.send({ "success": true, channel })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/channel/attribute/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            await model.v1.channel.attribute.update(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/channel/show", async (req, res) => {
        try {
            const params = assign(req.query)
            const session = await fastify.authenticate(req, res)
            if (session.user_id) {
                params.requested_by = session.user_id
            }
            const channel = await model.v1.channel.show(fastify.mongo.db, params)
            res.send({ "success": true, channel })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/channel/join", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const channel = await memcached.v1.channel.show(fastify.mongo.db, { "id": req.body.channel_id })
            if (channel === null) {
                throw new Error("チャンネルが存在しません")
            }
            const already_in_community = await memcached.v1.community.joined(fastify.mongo.db, {
                "user_id": session.user_id,
                "community_id": channel.community_id
            })
            if (already_in_community === false) {
                try {
                    await model.v1.community.join(fastify.mongo.db, {
                        "user_id": session.user_id,
                        "community_id": channel.community_id
                    })
                } catch (error) {
                    throw new Error("問題が発生したためリクエストを続行できません")
                }
            }
            const params = assign(req.body, { "user_id": session.user_id })
            await model.v1.channel.join(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/channel/invite", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }

            const user_to_invite = await memcached.v1.user.show(fastify.mongo.db, {
                "id": req.body.user_id_to_invite,
                "name": req.body.user_name_to_invite
            })
            if (user_to_invite === null) {
                throw new Error("対象のユーザーが見つかりません")
            }

            const params = {
                "requested_user_id": session.user_id,
                "user_id_to_invite": user_to_invite.id,
                "channel_id": req.body.channel_id
            }
            await model.v1.channel.invite(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/channel/kick", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }

            const user_to_kick = await memcached.v1.user.show(fastify.mongo.db, {
                "id": req.body.user_id_to_kick,
                "name": req.body.user_name_to_kick
            })
            if (user_to_kick === null) {
                throw new Error("対象のユーザーが見つかりません")
            }

            const params = {
                "requested_user_id": session.user_id,
                "user_id_to_kick": user_to_kick.id,
                "channel_id": req.body.channel_id
            }
            await model.v1.channel.kick(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/channel/members/list", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const members = await model.v1.channel.members(fastify.mongo.db, {
                "channel_id": req.query.channel_id
            })
            res.send({ "success": true, members })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/channel/permissions/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { allowed } = req.body
            if (typeof allowed !== "boolean") {
                throw new Error("allowedを指定してください")
            }
            const { channel_id } = req.body
            await model.v1.channel.permissions.update(fastify.mongo.db, Object.assign({}, req.body, {
                "channel_id": channel_id,
                "user_id": session.user_id,
                "allowed": allowed
            }))

            const permissions = await api.v1.channel.permissions.get(fastify.mongo.db, {
                "channel_id": channel_id
            })
            res.send({ "success": true })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}