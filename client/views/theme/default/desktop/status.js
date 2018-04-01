import React, { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../beluga.config"
import parse, { split_emoji_unicode, parse_emoji_unicode } from "./parser"
import ReactionsView from "./status/reactions"
import { request } from "../../../../api"
import assert, { is_object, is_string } from "../../../../assert"
import { created_at_to_elapsed_time, time_from_create_at } from "../../../../libs/date"

// 主に画像をまとめる
export const preprocess_text = text => {
    const lines = text.split("\n")
    const components = []
    for (const sentence of lines) {
        const new_line = true
        const array = sentence.split(/(https?:\/\/[^\s 　]+)/g)
        for (const component of array) {
            if (component.length === 0) {
                continue
            }
            if (new_line) {
                components.push(component)
                new_line = false
                continue
            }
            if (component.match(/\.(jpg|gif|png|jpeg)(:orig)?$/)) {
                components.push(component)
                continue
            }
            const last = components[components.length - 1]
            components[components.length - 1] = last + component
        }
    }
    const body = []
    let images = []
    for (const sentence of components) {
        if (sentence.match(/^https?:\/\/.+?\.(jpg|png|gif|jpeg)/)) {
            images.push(sentence)
            continue
        }
        if (sentence.match(/^[  ]$/)) {
            if (images.length > 0) {
                continue
            }
        }
        if (images.length > 0) {
            body.push(images)
            images = []
        }
        body.push(sentence)
    }
    if (images.length > 0) {
        body.push(images)
    }
    return body
}

@observer
export default class StatusView extends Component {
    constructor(props) {
        super(props)
        const { status, onClickHashtag, onClickMention } = props
        assert(is_object(status), "@status must be of type object")

        // 本文のビューを構築しておく
        const body = preprocess_text(status.text)
        const bodyView = []
        for (const contents of body) {
            // 画像以外
            if (typeof contents === "string") {
                bodyView.push(<p>{parse(contents, status, { onClickHashtag, onClickMention })}</p>)
                continue
            }
            // 連続する画像
            if (Array.isArray(contents)) {
                if (contents.length <= 3) {
                    const imageViews = []
                    for (const image_source of contents) {
                        const nodes = parse(image_source, status, {})
                        for (const view of nodes) {
                            imageViews.push(view)
                        }
                    }
                    bodyView.push(<div className="status-body-gallery">{imageViews}</div>)
                    continue
                }
                const div = parseInt(Math.ceil(contents.length / 3))
                for (let n = 0; n < div; n++) {
                    const end = Math.min((n + 1) * 3, contents.length)
                    const subset = contents.slice(n * 3, end)
                    const imageViews = []
                    for (const image_source of subset) {
                        const nodes = parse(image_source, status, {})
                        for (const view of nodes) {
                            imageViews.push(view)
                        }
                    }
                    bodyView.push(<div className="status-body-gallery">{imageViews}</div>)
                }
            }
        }
        this.bodyView = bodyView

        // ユーザー名（絵文字を使う場合があるため）
        this.displayNameView = null
        if (is_string(status.user.display_name) && status.user.display_name.length > 0) {
            const components = split_emoji_unicode([status.user.display_name])
            const subviews = []
            for (const substr of components) {
                // 絵文字（ユニコード）
                if (parse_emoji_unicode(substr, subviews)) {
                    continue
                }
                // それ以外
                subviews.push(substr)
            }
            this.displayNameView = subviews
        }

        this.state = {
            "elapsed_time_str": created_at_to_elapsed_time(status.created_at),
            "created_at_str": time_from_create_at(status.created_at)
        }
    }
    componentDidMount() {
        // const footer = this.refs.footer
        // const action = this.refs.action
        // action.style.top = `${footer.offsetTop - 6}px`
        this.updateTime()
    }
    onMouseEnter = event => {
        const footer = this.refs.footer
        const action = this.refs.action
        action.style.top = `${footer.offsetTop - 7}px`
        this.prev_footer_offset_top = footer.offsetTop
    }
    onMouseMove = event => {
        const footer = this.refs.footer
        if (footer.offsetTop !== this.prev_footer_offset_top) {
            const action = this.refs.action
            action.style.top = `${footer.offsetTop - 7}px`
            this.prev_footer_offset_top = footer.offsetTop
        }
    }
    onMouseLeave = event => {
        const footer = this.refs.footer
    }
    toggleFavorite = event => {
        event.preventDefault()
        const { status } = this.props
        if (status.favorited) {
            status.favorites.destroy()
        } else {
            status.favorites.create()
        }
    }
    createLike = event => {
        event.preventDefault()
        const { status } = this.props
        status.likes.increment()
    }
    toggleReaction = event => {
        event.preventDefault()
        const { status } = this.props
        const { x, y } = event.target.getBoundingClientRect()
        emojipicker.show(x, y + window.pageYOffset + event.target.clientHeight, shortname => {
            status.reactions.toggle(shortname)
        })
    }
    destroy = event => {
        event.preventDefault()
        const { status } = this.props
        status.destroy()
    }
    updateTime() {
        const { status } = this.props
        const base = Date.now()
        let diff = (base - status.created_at) / 1000
        let new_interval = 3600
        if (diff < 60) {
            new_interval = 5
        } else if (diff < 3600) {
            new_interval = 60
        } else {
            new_interval = 1800
        }
        clearInterval(this._update_time)
        this._update_time = setInterval(() => {
            this.updateTime()
        }, new_interval * 1000)
        this.setState({
            "elapsed_time_str": created_at_to_elapsed_time(status.created_at),
            "created_at_str": time_from_create_at(status.created_at)
        })
    }
    render() {
        const { status, options, onClickHashtag, onClickMention } = this.props
        const { user } = status
        let likesView = null
        if (status.likes.count > 0) {
            const starViews = []
            for (let i = 0; i < status.likes.count; i++) {
                starViews.push(<p></p>)
            }
            likesView = <div className="status-likes">{starViews}</div>
        }

        let favoritesView = null
        if (status.favorites.count > 0) {
            const userViews = []
            for (const user of status.favorites.users) {
                userViews.push(
                    <a href={`/user/${user.name}`} target="_blank">
                        <img src={user.avatar_url} />
                    </a>
                )
            }
            favoritesView = <div className="status-favofites">
                <div className="users">
                    {userViews}
                </div>
                <div className="meta">
                    <span className="sep"></span>
                    <span className="count verdana">{status.favorites.count}</span>
                    <span className="unit meiryo">ふぁぼ</span>
                </div>
            </div>
        }

        let belongingView = null
        const { server, hashtag, recipient } = status
        if (options.show_belonging) {
            if (hashtag && server) {
                belongingView = <a href={`/server/${server.name}/${hashtag.tagname}`} onClick={onClickHashtag} className="belonging hashtag meiryo" data-tagname={hashtag.tagname}>#{hashtag.tagname}</a>
            }
            if (recipient && server) {
                belongingView = <a href={`/server/${server.name}/@${recipient.name}`} onClick={onClickMention} className="belonging recipient meiryo" data-name={recipient.name}>@{recipient.name}</a>
            }
        }
        return (
            <div className="status" onMouseEnter={this.onMouseEnter} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave}>
                <div className="inside">
                    <div className="status-left">
                        <a href="/user/" className="avatar link">
                            <img src={user.avatar_url} />
                        </a>
                    </div>
                    <div className="status-right">
                        <div className="status-header">
                            <div className="inside">
                                <a href="/user/" className="avatar link">
                                    {this.displayNameView ? <span className="display-name">{this.displayNameView}</span> : null}
                                    <span className="name verdana">@{user.name}</span>
                                </a>
                                <a href={`/status/${user.name}/${status.id}`} className="time meiryo">{this.state.elapsed_time_str}</a>
                            </div>
                        </div>
                        <div className="status-content">
                            <div className="body">{this.bodyView}</div>
                        </div>
                        {likesView}
                        {favoritesView}
                        <ReactionsView status={status} />
                        <div className="status-footer" ref="footer">
                            {belongingView}
                            <a href={`/status/${user.name}/${status.id}`} className="time verdana">{this.state.created_at_str}</a>
                        </div>
                    </div>
                    <div className="status-action" ref="action">
                        <div className="inside">
                            <button className="like user-defined-color-hover" onClick={this.createLike}></button>
                            <button className="favorite user-defined-color-hover" onClick={this.toggleFavorite}></button>
                            <button className="emoji emojipicker-ignore-click user-defined-color-hover" onClick={this.toggleReaction}></button>
                            <button className="comment user-defined-color-hover"></button>
                            <button className="destroy user-defined-color-hover" onClick={this.destroy}></button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}