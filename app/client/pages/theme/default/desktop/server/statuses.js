import { Component } from "react"
import { configure, observable, action } from "mobx"
import { observer } from "mobx-react"
import Router from "next/router"
import classnames from "classnames"
import enums from "../../../../../enums"
import assign from "../../../../../libs/assign"
import warning from "../../../../../libs/warning"
import assert, { is_object, is_array, is_string } from "../../../../../assert"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import Head from "../../../../../views/theme/default/desktop/head"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import { MultipleColumnsContainerView, ColumnView } from "../../../../../views/theme/default/desktop/column"
import { default_options as default_column_options } from "../../../../../stores/theme/default/desktop/column"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { add_custom_shortnames } from "../../../../../stores/theme/default/common/emoji"
import { update_current_settings } from "../../../../../settings/desktop"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class MultipleColumnsContainer extends MultipleColumnsContainerView {
    constructor(props) {
        super(props)
        const { server, logged_in, columns, callback_change } = props
        assert(is_object(server), "$server must be of type object")
        assert(is_object(logged_in), "$logged_in must be of type object")
        assert(is_array(columns), "$columns must be of type array or null")
        if (callback_change) {
            assert(is_function(callback_change), "$callback_change must be of type function")
            this.callback_change = callback_change
        }

        for (const column of columns) {
            const { type, param_ids, params, statuses } = column

            assert(is_object(param_ids), "$param_ids must be of type object")
            assert(is_object(params), "$params must be of type object")
            assert(is_array(statuses), "$statuses must be of type array")
            assert(is_string(type), "$type must be of type string")

            const options = assign(default_column_options)

            if (type === enums.column.type.server) {
                options.status.show_belonging = true
                options.postbox.is_hidden = true
                if (params.server.id === server.id) {
                    options.is_closable = false
                }
            }

            if (type === enums.column.type.hashtag) {
                if (params.hashtag.joined === false) {
                    options.postbox.is_hidden = true
                }
            }

            this.insert(type, params,
                options,
                statuses,
                enums.column.target.blank,
                -1
            )
        }
    }
}

export default class App extends Component {
    // サーバー側でのみ呼ばれる
    // ここで返したpropsはクライアント側でも取れる
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { csrf_token, custom_emoji_shortnames, server, desktop_settings } = props

        request.set_csrf_token(csrf_token)
        add_custom_shortnames(custom_emoji_shortnames)
        update_current_settings(desktop_settings)

        this.state = {
            "app_inline_flex": false
        }

        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }

        if (typeof window !== "undefined") {
            window.addEventListener("resize", event => {
                if (this.resize_time_id) {
                    clearTimeout(this.resize_time_id)
                }
                this.resize_time_id = setTimeout(() => {
                    this.updateJustifyContent()
                }, 50);
            });
        }

        // Safariのブラウザバック問題の解消
        if (typeof window !== "undefined") {
            Router.beforePopState(({ url, as, options }) => {
                return false
            });
        }
    }
    componentDidMount = () => {
        this.updateJustifyContent()
    }
    updateJustifyContent = () => {
        const columns = document.getElementsByClassName("column")
        let width = 0
        Array.prototype.forEach.call(columns, dom => {
            width += dom.clientWidth + 10
        })
        if (window.innerWidth < width) {
            this.setState({
                "app_inline_flex": true
            })
        } else {
            this.setState({
                "app_inline_flex": false
            })
        }
    }
    render() {
        const { server, logged_in, hashtags, platform, pinned_emoji_shortnames, custom_emoji_shortnames, statuses_home, statuses_server } = this.props
        let title = `${server.display_name} / ${config.site.name}`
        return (
            <div id="app" className={classnames("timeline world", {
                "inline-flex": this.state.app_inline_flex
            })}>
                <Head title={title} platform={platform} logged_in={logged_in} />
                <NavigationBarView server={server} logged_in={logged_in} active="statuses" />
                <div id="content" className={classnames("timeline world tooltip-offset-base", { "logged_in": !!logged_in })}>
                    <MultipleColumnsContainer {...this.props} />
                </div>
                <EmojiPicker
                    pinned_shortnames={pinned_emoji_shortnames}
                    custom_shortnames={custom_emoji_shortnames}
                    server={server} />
                <Tooltip />
            </div>
        )
    }
}