import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const fetch_func = api.v1.timeline.thread.fetch

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch_func)
const memcached_all = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = in_reply_to_status_id => {
        in_reply_to_status_id = try_convert_to_hex_string(in_reply_to_status_id, "$in_reply_to_status_idが不正です")
        memcached_diff.delete(in_reply_to_status_id)
        memcached_all.delete(in_reply_to_status_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const in_reply_to_status_id = try_convert_to_hex_string(params.in_reply_to_status_id, "$in_reply_to_status_idを指定してください")
    const { count } = params
    assert(is_number(count), "$count must be of type number")

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        return await memcached_all.fetch([in_reply_to_status_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch_func(db, params)
    }

    return await memcached_diff.fetch([in_reply_to_status_id, since_id, count], db, params)
})