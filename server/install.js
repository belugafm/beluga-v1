import "babel-polyfill"
import mongo from "./mongo"
const MongoClient = require("mongodb").MongoClient


// ユーザー名の予約語を登録
async function register_reserved_user_names(db) {
	const collection = db.collection("users")
	const reserved_names = [
		"admin", "beluga"
	]
	for (const name of reserved_names) {
		try {
			const existing = await collection.findOne({ name })
			if (existing !== null) {
				continue
			}
			const result = await collection.insertOne({	name })
		} catch (error) {
			console.log(error)
		}
	}
}

// サーバー名の予約語を登録
async function register_reserved_server_names(db) {
	const collection = db.collection("servers")
	const reserved_names = [
		"create"
	]
	for (const name of reserved_names) {
		try {
			const existing = await collection.findOne({ name })
			if (existing !== null) {
				continue
			}
			const result = await collection.insertOne({ name })
		} catch (error) {
			console.log(error)
		}
	}
}

// データベースの初期化を行う
(async () => {
	try {
		const client = await MongoClient.connect(mongo.url)
		console.log("MongoDBへ接続")
		const db = client.db(mongo.database.production)
		await register_reserved_user_names(db)
		await register_reserved_server_names(db)

		// インデックスを張る
		db.collection("statuses").createIndex({ "hashtag_id": -1 })
		db.collection("statuses").createIndex({ "recipient_id": -1 })
		db.collection("statuses").createIndex({ "user_id": -1 })

		client.close()
	} catch (error) {
		console.log(error)
	}

})()