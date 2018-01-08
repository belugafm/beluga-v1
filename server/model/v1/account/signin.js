import beluga from "../../../api"

export default async (db, params) => {
	const user = await beluga.v1.account.signin(db, params)
	user.id = user._id
	for (const key in user) {
		if (key.indexOf("_") == 0) {
			delete user[key]
		}
	}
	return user
}