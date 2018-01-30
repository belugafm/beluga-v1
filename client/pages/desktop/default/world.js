import { Component } from "react"
import { useStrict } from "mobx"
import TimelineView from "../../../views/desktop/default/timeline"
import PostboxView from "../../../views/desktop/default/postbox"
import NavigationBarView from "../../../views/desktop/default/navigationbar"
import Head from "../../../views/desktop/default/head"
import ServerTimelineHeaderView from "../../../views/desktop/default/timeline/header/server"
import HomeTimelineHeaderView from "../../../views/desktop/default/timeline/header/home"
import EmojiPickerView, { EmojiPicker } from "../../../views/desktop/default/emoji"
import HashtagsCardView from "../../../views/desktop/default/card/hashtags"
import ServerCardView from "../../../views/desktop/default/card/server"
import HomeTimelineStore from "../../../stores/timeline/home"
import ServerTimelineStore from "../../../stores/timeline/server"
import StatusStore from "../../../stores/status"
import config from "../../../beluga.config"
import { request } from "../../../api"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

export default class App extends Component {

	// サーバー側でのみ呼ばれる
	// ここで返したpropsはクライアント側でも取れる
	static async getInitialProps({ query }) {
		return { ...query }
	}

	constructor(props) {
		super(props)
		const { server, logged_in, statuses } = props
		this.timelines = {}
		if (logged_in) {
			this.timelines.home = {
				"store": (() => {
					const timeline = new HomeTimelineStore({ "user_id": logged_in.id, "server_id": server.id },
						{ "user": logged_in, server })
					const stores = []
					for (const status of statuses.home) {
						const store = new StatusStore(status)
						stores.push(store)
					}
					timeline.append(stores)
					return timeline
				})(),
				"options": {}
			}
		}
		this.timelines.server = {
			"store": (() => {
				const timeline = new ServerTimelineStore({ "server_id": server.id }, { server })
				const stores = []
				for (const status of statuses.server) {
					const store = new StatusStore(status)
					stores.push(store)
				}
				timeline.append(stores)
				return timeline
			})(),
			"options": {
				"status": {
					"show_belonging": true
				}
			}
		}
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
		this.emojipicker = null
		if (typeof window !== "undefined") {
			window.emojipicker = new EmojiPicker()
			this.emojipicker = emojipicker
		}
		if (typeof history !== "undefined") {
			history.scrollRestoration = "manual"
		}
	}

	render() {
		const { server, logged_in, hashtags, platform, media } = this.props
		let title = `${server.display_name} / ${config.site.name}`
		if (logged_in) {
			title = `@${logged_in.name} / ` + title
		}
		return (
			<div id="app" className="timeline world">
				<Head title={title} platform={platform} />
				<NavigationBarView server={server} logged_in={logged_in} active="world" />
				<div id="content" className="timeline world">
					<div className="inside column-container">
						{(() => {
							if (logged_in) {
								return (
									<div className="column timeline">
										<div className="inside timeline-container round">
											<HomeTimelineHeaderView timeline={this.timelines.home.store} user={logged_in} />
											<div className="content">
												<div className="vertical"></div>
												<PostboxView logged_in={logged_in} server={server} recipient={logged_in} media={media} />
												<TimelineView timeline={this.timelines.home.store} options={this.timelines.home.options} />
											</div>
										</div>
									</div>
								)
							}
						})()}
						<div className="column timeline">
							<div className="inside timeline-container round">
								<ServerTimelineHeaderView timeline={this.timelines.server.store} server={server} />
								<div className="content">
									<div className="vertical"></div>
									<TimelineView timeline={this.timelines.server.store} options={this.timelines.server.options} />
								</div>
							</div>
						</div>
						<div className="column server">
							<ServerCardView server={server} />
							<HashtagsCardView hashtags={hashtags} server={server} />
						</div>
					</div>
				</div>
				<EmojiPickerView picker={this.emojipicker} />
			</div>
		)
	}
}