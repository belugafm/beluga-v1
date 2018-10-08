import { Component } from "react"
import { configure } from "mobx"
import Router from "next/router"
import enums from "../../../../../enums"
import NavigationBarView from "../../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../../stores/theme/default/mobile/column"
import { ThreadColumnView } from "../../../../../views/theme/default/mobile/column"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assign from "../../../../../libs/assign"
import assert, { is_object, is_string, is_array } from "../../../../../assert"
import { add_custom_shortnames, get_shared_picker_store } from "../../../../../stores/theme/default/common/emoji"
import EmojiPicker from "../../../../../views/theme/default/mobile/emoji"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    // サーバー側でのみ呼ばれる
    // ここで返したpropsはクライアント側でも取れる
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { columns, request_query, csrf_token, custom_emoji_shortnames } = props
        assert(is_array(columns), "$columns must be of type array or null")
        assert(columns.length > 0, "$columns.length must be at least 1 ")
        assert(is_object(request_query), "$request_query must be of type object")

        const column = columns[0]
        const { type, params, statuses } = column

        assert(is_object(params), "$params must be of type object")
        assert(is_array(statuses), "$statuses must be of type array")
        assert(is_string(type), "$type must be of type string")

        this.column = new ColumnStore(type,
            params,
            {
                "timeline": {
                    "cancel_update": !!request_query.max_id,
                }
            },
            statuses
        )
        request.set_csrf_token(csrf_token)
        add_custom_shortnames(custom_emoji_shortnames)

        // Safariのブラウザバック問題の解消
        if (typeof window !== "undefined") {
            Router.beforePopState(({ url, as, options }) => {
                return false
            });
        }
    }
    render() {
        const { in_reply_to_status, server, logged_in, platform, device, pinned_emoji_shortnames, custom_emoji_shortnames } = this.props
        const { text } = in_reply_to_status
        const title = (text.length > 50) ? text.substr(0, 50) + "…" : text
        return (
            <div id="app" className="timeline home">
                <Head title={`${title} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className="timeline home">
                    <ThreadColumnView {...this.props} column={this.column} />
                </div>
                <EmojiPicker
                    pinned_shortnames={pinned_emoji_shortnames}
                    custom_shortnames={custom_emoji_shortnames}
                    server={server} />
            </div>
        )
    }
}