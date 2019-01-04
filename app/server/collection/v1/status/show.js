import model from "../../../model"
import { is_object } from "../../../assert"

export default async (db, params) => {
    const status = await model.v1.status.show(db, params)
    if (status === null) {
        return status
    }
    if (params.trim_user === false) {
        const user = await model.v1.user.show(db, { "id": status.user_id })
        if (user === null) {
            return null
        }
        status.user = user
    }
    if (status.recipient_id && params.trim_recipient === false) {
        const recipient = await model.v1.user.show(db, { "id": status.recipient_id })
        if (recipient === null) {
            return null
        }
        status.recipient = recipient
    }
    if (status.server_id && params.trim_server === false) {
        const server = await model.v1.server.show(db, { "id": status.server_id })
        if (server === null) {
            return null
        }
        status.server = server
    }
    if (status.channel_id && params.trim_channel === false) {
        const channel = await model.v1.channel.show(db, { "id": status.channel_id })
        if (channel === null) {
            return null
        }
        status.channel = channel
    }
    if (status.last_comment_status_id) {
        const last_comment = await model.v1.status.show(db, { "id": status.last_comment_status_id })
        if (last_comment) {
            status.last_comment = last_comment
        }
    }
    return status
}