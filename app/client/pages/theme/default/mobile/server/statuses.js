import { configure } from "mobx"
import enums from "../../../../../enums"
import NavigationBarView from "../../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../../stores/theme/default/mobile/column"
import { ServerColumnView } from "../../../../../views/theme/default/mobile/column"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assign from "../../../../../libs/assign"
import assert, { is_object, is_string, is_array } from "../../../../../assert"
import { add_custom_shortnames, get_shared_picker_store } from "../../../../../stores/theme/default/common/emoji"
import EmojiPicker from "../../../../../views/theme/default/mobile/emoji"
import Component from "../../../../../views/app"
import { TimelineOptions } from "../../../../../stores/theme/default/desktop/timeline"
import { ColumnOptions } from "../../../../../stores/theme/default/desktop/column"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    constructor(props) {
        super(props)
        const { columns, request_query, custom_emoji_shortnames,
            muted_users, muted_words, has_newer_statuses, has_older_statuses } = props
        assert(is_array(columns), "$columns must be of type array or null")
        assert(columns.length > 0, "$columns.length must be at least 1 ")
        assert(is_array(muted_users), "$muted_users must be of type array")
        assert(is_array(muted_words), "$muted_words must be of type array")
        assert(is_object(request_query), "$request_query must be of type object")

        assert(columns.length > 0, "length of $columns must be greater than 0")
        const column = columns[0]

        const { type, params, statuses } = column
        assert(is_object(params), "$params must be of type object")
        assert(is_array(statuses), "$statuses must be of type array")
        assert(is_string(type), "$type must be of type string")

        const column_options = new ColumnOptions()

        const opt = new TimelineOptions()
        opt.has_newer_statuses = has_newer_statuses
        opt.has_older_statuses = has_older_statuses
        if (has_newer_statuses) {
            opt.auto_reloading_enabled = false
        }
        opt.muted_users = muted_users
        opt.muted_words = muted_words
        column_options.timeline = opt

        this.column = new ColumnStore(type, params, column_options, statuses)
        add_custom_shortnames(custom_emoji_shortnames)
    }
    render() {
        const { server, logged_in, platform, device, pinned_emoji_shortnames, custom_emoji_shortnames } = this.props
        return (
            <div id="app" className="timeline home">
                <Head title={`${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="statuses" />
                <div id="content" className="timeline home">
                    <ServerColumnView {...this.props} column={this.column} />
                </div>
                <EmojiPicker
                    pinned_shortnames={pinned_emoji_shortnames}
                    custom_shortnames={custom_emoji_shortnames}
                    server={server} />
            </div>
        )
    }
}