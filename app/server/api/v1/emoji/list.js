import config from "../../../config/beluga"
import assert, { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")
    const rows = await db.collection("emojis").find({ server_id }).sort({ "shortname": 1 }).toArray()
    const emojis = []
    rows.forEach(row => {
        emojis.push({
            "shortname": row.shortname,
            "added_by": row.added_by,
            "added_at": row.added_at,
        })
    })
    return emojis
}