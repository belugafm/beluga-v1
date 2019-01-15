import config from "../../../config/beluga"
import storage from "../../../config/storage"
import api from "../../../api"
import logger from "../../../logger"
import assert from "../../../assert";

export default async (db, params) => {
    const user = await api.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const server = await api.v1.server.create(db, params)

    // アイコン
    const remote = storage.servers[0]
    try {
        await api.v1.server.avatar.reset(db, {
            "server_id": server.id,
            "storage": remote
        })
    } catch (error) {
        logger.log({
            "level": "error",
            "message": "Failed to create a server",
            "error": error.toString(),
            "server": server,
            "params": params
        })
        throw error
    }

    return server
}