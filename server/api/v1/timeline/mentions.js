import config from "../../../config/beluga"
import { is_number } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const recipient_id = try_convert_to_object_id(params.recipient_id, "@recipient_idが不正です")

    if (params.server_id) {
        params.server_id = try_convert_to_object_id(params.server_id, "@server_idが不正です")
    }

    if (params.since_id) {
        params.since_id = try_convert_to_object_id(params.since_id, "@since_idが不正です")
    }

    if (params.max_id) {
        params.max_id = try_convert_to_object_id(params.max_id, "@max_idが不正です")
    }

    if (is_number(params.count) === false) {
        throw new Error("countが不正です")
    }
    if (params.count > config.timeline.max_count) {
        params.count = config.timeline.max_count
    }

    if (is_number(params.sort) === false) {
        throw new Error("sortが不正です")
    }
    if (params.sort !== 1 && params.sort !== -1) {
        throw new Error("sortが不正です")
    }

    const query = {
        recipient_id
    }
    if(params.server_id){
        query.server_id = params.server_id
    }
    if (params.since_id) {
        query.status_id = { "$gt": params.since_id }
    }
    if (params.max_id) {
        query.status_id = { "$lt": params.max_id }
    }

    const collection = db.collection("mentions")
    return await collection.find(query).sort({ "_id": -1 }).limit(params.count).toArray()
}