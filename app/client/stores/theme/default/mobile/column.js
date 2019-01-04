import { observable, action } from "mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object, is_array } from "../../../../assert"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import StatusStore from "../common/status"
import HomeTimelineStore from "../desktop/timeline/home"
import HahstagTimelineStore from "../desktop/timeline/channel"
import ServerTimelineStore from "../desktop/timeline/server"
import { get_timeline_store, default_options } from "../desktop/column"

export default class ColumnStore {
    constructor(type, params, options, initial_statuses) {
        this.type = type
        this.params = params
        this.options = options
        this.timeline = get_timeline_store(type, params, options.timeline)
        if (Array.isArray(initial_statuses)) {
            this.timeline.setStatuses(initial_statuses)
        }
    }
}