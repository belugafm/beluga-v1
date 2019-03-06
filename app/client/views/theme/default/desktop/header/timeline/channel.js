import { Component } from "react"
import classnames from "classnames"
import ws from "../../../../../../websocket"
import assert, { is_object, is_function, is_string } from "../../../../../../assert"
import * as notification from "../../../../../../notification"
import ChannelTimelineStore from "../../../../../../stores/theme/default/desktop/timeline/channel"


class NotificationMenuItem extends Component {
    constructor(props) {
        super(props)
        const { timeline } = this.props
        assert(timeline instanceof ChannelTimelineStore, "$timeline must be an instance of TimelineStore")
        this.state = {
            "notification_enabled": false
        }
    }
    componentDidMount = () => {
        ws.addEventListener("message", event => {
            if (this.state.notification_enabled === false) {
                return
            }
            const data = JSON.parse(event.data)
            if (data.status_updated) {
                const { status } = data
                if (status.do_not_notify) {
                    return
                }
                const { timeline } = this.props
                if (timeline.statusBelongsTo(status)) {
                    let text = status.text
                    if (text.length > 140) {
                        text = text.slice(0, 140)
                    }
                    notification.push("新しい投稿があります", {
                        "body": `@${status.user.name}: ${text}`
                    })
                }
            }
        })
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "notification_enabled": !this.state.notification_enabled
        })
    }
    render() {
        return (
            <div className="item tooltip" onClick={this.toggle}>
                <span className={classnames("icon notification user-defined-color-active", {
                    "active": this.state.notification_enabled
                })}></span>
                <span className="tooltip-message bottom">{this.state.notification_enabled ? "通知はオンです" : "通知はオフです"}</span>
            </div>
        )
    }
}

class SettingsMenuItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_active": false
        }
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "is_active": !this.state.is_active
        })
    }
    render() {
        return (
            <div className={classnames("item timeline-header-dropdown-menu tooltip", {
                "active": this.state.is_active
            })} onClick={this.toggle}>
                <span className={classnames("icon settings user-defined-color-active", {
                    "active": this.state.is_active
                })}></span>
                <span className="tooltip-message bottom">チャンネル設定</span>
                <div className="timeline-header-dropdown-component search" onClick={event => event.stopPropagation()}>
                    <div className="inside">
                        未実装です
                    </div>
                </div>
            </div>
        )
    }
}

class SearchMenuItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_active": false
        }
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "is_active": !this.state.is_active
        })
    }
    render() {
        const { channel } = this.props
        return (
            <div className={classnames("item timeline-header-dropdown-menu tooltip", {
                "active": this.state.is_active
            })} onClick={this.toggle}>
                <span className={classnames("icon search user-defined-color-active", {
                    "active": this.state.is_active
                })}></span>
                <span className="tooltip-message bottom">投稿を検索</span>
                <div className="timeline-header-dropdown-component search" onClick={event => event.stopPropagation()}>
                    <div className="inside">
                        未実装です
                    </div>
                </div>
            </div>
        )
    }
}

const MoreMenuItem = ({ community, channel, handle_close, handle_expand }) => {
    return (
        <div className="item timeline-header-dropdown-menu toggle-by-hover">
            <span className="icon more user-defined-color-hover"></span>
            <div className="timeline-header-dropdown-component more" onClick={event => event.stopPropagation()}>
                <div className="inside">
                    <ul className="menu">
                        <a className="item user-defined-bg-color-hover" onClick={handle_close}>チャンネルを閉じる</a>
                        <a className="item user-defined-bg-color-hover" onClick={handle_expand}>横幅を最大化</a>
                        <span className="divider"></span>
                        <a className="item user-defined-bg-color-hover">指定の日付に移動する</a>
                        <a className="item user-defined-bg-color-hover">詳細を表示</a>
                        <a className="item user-defined-bg-color-hover">{`${channel.id}`}</a>
                        <a className="item user-defined-bg-color-hover" href={`/${community.name}/${channel.name}/settings/profile`}>チャンネル設定</a>
                        <span className="divider"></span>
                        <a className="item user-defined-bg-color-hover">{`#${channel.name} から退出する`}</a>
                    </ul>
                </div>
            </div>
        </div>
    )
}


export default class HeaderComponent extends Component {
    constructor(props) {
        super(props)
        const { channel } = props
        assert(is_object(channel), "$channel must be of type object")
    }
    render() {
        const { community, channel, timeline, handle_close, handle_expand, handle_back } = this.props
        return (
            <div className="timeline-header-component">
                <div className="inside">
                    <div className="label-area">
                        <span className="icon channel"></span>
                        <span className="label">{channel.name}</span>
                    </div>
                    <div className="menu">
                        <NotificationMenuItem timeline={timeline} />
                        <SearchMenuItem />
                        <MoreMenuItem community={community} channel={channel} handle_close={handle_close} handle_expand={handle_expand} />
                    </div>
                </div>
            </div>
        )
    }
}