import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import user_show from "../user/show"

export default async (db, params) => {
	params = Object.assign({
		"count": 20,
		"since_id": null,
		"max_id": null,
		"trim_user": true,
		"sort": -1
	}, params)

	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("idが不正です")
	}

	if (!!params.since_id) {
		if (typeof params.since_id === "string") {
			try {
				params.since_id = ObjectID(params.since_id)
			} catch (error) {
				throw new Error("since_idが不正です")
			}
		}
		if (!(params.since_id instanceof ObjectID)) {
			throw new Error("since_idが不正です")
		}
	} else {
		params.since_id = null
	}

	if (!!params.max_id) {
		if (typeof params.max_id === "string") {
			try {
				params.max_id = ObjectID(params.max_id)
			} catch (error) {
				throw new Error("max_idが不正です")
			}
		}
		if (!(params.max_id instanceof ObjectID)) {
			throw new Error("max_idが不正です")
		}
	} else {
		params.max_id = null
	}

	if (typeof params.count !== "number") {
		throw new Error("countが不正です")
	}
	if (params.count > config.timeline.max_count) {
		params.count = config.timeline.max_count
	}

	if (typeof params.sort !== "number") {
		throw new Error("sortが不正です")
	}
	if(params.sort !== 1 && params.sort !== -1){
		throw new Error("sortが不正です")
	}

	params.trim_user = !!params.trim_user

	let query = {
		"hashtag_id": params.id
	}
	if (params.since_id) {
		query._id = { "$gt": params.since_id }
	}
	if (params.max_id) {
		query._id = { "$lt": params.max_id }
	}

	const collection = db.collection("statuses")
	const result = await collection.find(query, {
		"sort": { "_id": params.sort },
		"limit": params.count
	}).toArray()

	if (params.trim_user) {
		for (const status of result) {
			status.id = status._id
			delete status._id
		}
		return result
	}

	const statuses = []
	for (const status of result) {
		const user = await user_show(db, { "id": status.user_id })
		if (user === null) {
			continue
		}
		status.user = user
		status.id = status._id
		delete status._id
		statuses.push(status)
	}

	return statuses
}