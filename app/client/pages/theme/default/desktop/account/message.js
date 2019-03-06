import { configure } from "mobx"
import classnames from "classnames"
import enums from "../../../../../enums"
import assign from "../../../../../libs/assign"
import warning from "../../../../../libs/warning"
import assert, { is_object, is_array, is_string } from "../../../../../assert"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import HeaderComponent from "../../../../../views/theme/default/desktop/header/timeline/message"
import Head from "../../../../../views/theme/default/desktop/head"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import PostboxComponent from "../../../../../views/theme/default/desktop/postbox"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { get as get_desktop_settings } from "../../../../../settings/desktop"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"
import Component from "../../../../../views/app"
import { TimelineComponent } from "../../../../../views/theme/default/desktop/timeline"
import { TimelineOptions } from "../../../../../stores/theme/default/desktop/timeline"
import { StatusOptions } from "../../../../../stores/theme/default/common/status"
import DirectMessageTimelineStore from "../../../../../stores/theme/default/desktop/timeline/message"
import PostboxStore from "../../../../../stores/theme/default/common/postbox"
import UploadManager from "../../../../../stores/theme/default/common/uploader"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

const do_nothing = () => true

export default class App extends Component {
    constructor(props) {
        super(props)
        const { has_newer_statuses, has_older_statuses, statuses, muted_users, muted_words } = props

        const timeline_options = new TimelineOptions()
        timeline_options.has_newer_statuses = has_newer_statuses
        timeline_options.has_older_statuses = has_older_statuses
        if (has_newer_statuses) {
            timeline_options.auto_reloading_enabled = false
        }
        timeline_options.muted_users = muted_users
        timeline_options.muted_words = muted_words

        const status_options = new StatusOptions()
        status_options.trim_comments = false
        status_options.show_source_link = false

        this.timeline_options = timeline_options
        this.status_options = status_options

        const { recipient } = this.props

        this.timeline = new DirectMessageTimelineStore({
            "recipient_id": recipient.id
        }, {}, timeline_options)
        this.timeline.setStatuses(statuses)

        this.postbox = new PostboxStore({
            "recipient_id": recipient.id
        })

        this.uploader = new UploadManager()
    }
    render() {
        const { logged_in_user, recipient, platform, device, pinned_emoji_shortnames, pinned_media, recent_uploads } = this.props
        const desktop_settings = get_desktop_settings()
        const display_name = (recipient.display_name && recipient.display_name.length > 0) ? recipient.display_name : recipient.name
        const title = `メッセージ / ${display_name}@${recipient.name} / ${config.site.name}`
        return (
            <div className="app message">
                <Head title={title} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} active_tab="direct_message" />
                <div className="client">
                    <div className="inside">
                        <div className="message-component">
                            <div className="inside">
                                <HeaderComponent recipient={recipient} />
                                <PostboxComponent
                                    postbox={this.postbox}
                                    timeline={this.timeline}
                                    logged_in_user={logged_in_user}
                                    uploader={this.uploader}
                                    pinned_media={pinned_media}
                                    recent_uploads={recent_uploads} />
                                <TimelineComponent
                                    logged_in_user={logged_in_user}
                                    timeline={this.timeline}
                                    request_query={{}}
                                    timeline_options={this.timeline_options}
                                    status_options={this.status_options}
                                    handle_click_channel={do_nothing}
                                    handle_click_mention={do_nothing}
                                    handle_click_thread={do_nothing} />
                            </div>
                        </div>
                    </div>
                </div>
                <EmojiPicker pinned_shortnames={pinned_emoji_shortnames} />
            </div>
        )
    }
}