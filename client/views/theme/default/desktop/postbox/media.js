import React, { Component } from "react"

const get_thumbnail_url_of_item = item => {
    if (item.is_image) {
        return `${item.uri}/${item.directory}/${item.prefix}.square.${item.extension}`
    }
    if (item.is_video) {
        return `${item.uri}/${item.directory}/${item.prefix}.square.jpg`
    }
    return null
}

const get_original_url_of_item = item => {
    return `${item.uri}/${item.directory}/${item.prefix}.${item.extension}`
}

export class PostboxMediaView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_preview_hidden": true,
            "preview_position": {
                "x": -1,
                "y": -1
            },
            "preview_url": null
        }
    }
    onMouseOverImage = (event, preview_url, width, height) => {
        if (this.state.preview_url === preview_url) {
            return
        }
        const preview_width = 120
        const preview_height = preview_width / width * height
        const parent = this.refs.wrapper.getBoundingClientRect()
        const { x, y } = event.target.getBoundingClientRect()
        this.setState({
            "is_preview_hidden": false,
            "preview_position": {
                "x": x - parent.x - 60 + event.target.clientWidth / 2,
                "y": y - parent.y - preview_height - 4
            },
            preview_url
        })
    }
    onMouseOutImage = event => {
        this.setState({
            "is_preview_hidden": true,
            "preview_url": null
        })
    }
    render() {
        const { media, is_hidden, append, title } = this.props
        if (is_hidden) {
            return null
        }
        const mediaViews = []
        if (Array.isArray(media)) {
            const num_per_row = 8
            const rows = []
            const num_rows = Math.ceil(media.length / num_per_row)
            for (let y = 0; y < num_rows; y++) {
                rows.push(media.slice(y * num_per_row, Math.min((y + 1) * num_per_row, media.length)))
            }
            for (const row of rows) {
                const views = []
                for (const item of row) {
                    const thumbnail_url = get_thumbnail_url_of_item(item)
                    if (!thumbnail_url) {
                        continue
                    }
                    const original_url = get_original_url_of_item(item)
                    const sizes = item.prefix.split("-")
                    views.push(
                        <a href={original_url} className="item" onClick={event => append(event, item)}>
                            <img className="thumbnail" src={thumbnail_url} onMouseOut={this.onMouseOutImage} onMouseOver={event => this.onMouseOverImage(event, original_url, parseInt(sizes[0]), parseInt(sizes[1]))} />
                        </a>
                    )
                }
                mediaViews.push(
                    <div className="row">{views}</div>
                )
            }
        }
        if (mediaViews.length == 0) {
            return (
                <div className="postbox-media history no-media">
                    <a href="/settings/favorites" className="user-defined-color bold">画像を登録</a>するとここに表示されます
				</div>
            )
        }
        return (
            <div className="postbox-media history scroller-wrapper" ref="wrapper">
                <p className="title">{title}</p>
                <div className="scroller">
                    {mediaViews}
                </div>
                {this.state.is_preview_hidden ? null :
                    <div className="preview" style={{ "top": this.state.preview_position.y, "left": this.state.preview_position.x }}>
                        <img src={this.state.preview_url} />
                    </div>}
            </div>
        )
    }
}