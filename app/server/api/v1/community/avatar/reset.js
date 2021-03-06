import config from "../../../../config/beluga"
import logger from "../../../../logger"
import update from "./update"
import gm from "gm"
import { try_convert_to_object_id } from "../../../../lib/object_id"

// 正方形にグラデーションを書き、それを回転させてさらに正方形に切り抜く
const gm_draw = async (width, height, gradient, degree) => {
    return new Promise((resolve, reject) => {
        const start = gradient[0]
        const end = gradient[1]
        const rad = Math.abs(degree) / 180 * Math.PI
        const coeff1 = Math.sin(rad) + Math.cos(rad)
        const coeff2 = coeff1 * coeff1
        const _width = Math.ceil(width * coeff1)
        const _height = Math.ceil(height * coeff1)
        const pos = Math.ceil((width * coeff2 - width) / 2)
        gm(_width, _height)
            .in(`gradient:${start}-${end}`)
            .rotate("#FFFFFF", -30)
            .crop(width, height, pos, pos)
            .setFormat("png")
            .toBuffer(function (error, data) {
                if (error) {
                    return reject(error)
                }
                return resolve(data)
            })
    })
}

export default async (db, params) => {
    const { storage } = params
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")

    const size = config.community.profile.image_size
    const gradients = config.gradients
    const gradient = gradients[Math.floor(Math.random() * gradients.length)]
    const start = gradient[0]
    const end = gradient[1]
    if (!!start.match(/^#[0-9A-Fa-f]+$/) === false) {
        logger.log({
            "level": "error",
            "error": "Color code must start with '#'",
            "gradient": gradient
        })
        throw new Error("サーバーで問題が発生しました")
    }
    if (!!end.match(/^#[0-9A-Fa-f]+$/) === false) {
        logger.log({
            "level": "error",
            "error": "Color code must start with '#'",
            "gradient": gradient
        })
        throw new Error("サーバーで問題が発生しました")
    }
    const data = await gm_draw(size, size, gradient, -30)
    return update(db, {
        data,
        storage,
        community_id,
    })
}