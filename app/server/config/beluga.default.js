const use_https = true
export default {
    "https": use_https,
    "port": {
        "websocket": 8080,
        "app": 3000
    },
    "ip_address": "localhost", // コミュニティのIPアドレス
    "forbidden_isps": ["M247", "Contina"],  // VPNのプロバイダを規制する
    "status": {
        "max_text_length": 5000,
        "minimum_interval": 1000,   // 最小の投稿間隔をミリ秒で指定
        "reaction": {
            "limit": 3,		// 1投稿につき何種類の絵文字を追加できるか
            "allow_self_reactions": true	// 自分自身へのリアクションの追加を許可
        },
        "embedding": {
            "web": {
                "limit": 3,				// 1つの投稿にURLの埋め込みを何個まで許可するか
                // コミュニティ側でHTTPリクエストが発生するため大量の埋め込みを行うと負荷がかかる
                "timeout": 10,			// 秒
                "max_description_length": 200
            }
        },
        "forbidden_words": [
            "\u0C1C\u0C4D\u0C1E\u2427\u0C3E"	// Apple製品がクラッシュするため
        ]
    },
    "colors": ["#B9C4CA", "#E09580", "#E5D8CE", "#EBE39B", "#F9D2C9", "#FCC8B2", "#E5A0A6", "#B3D9DD",
        "#AD8FCF", "#8684DE", "#79CBD2", "#A9C8A2", "#C784C8", "#F8C785", "#B4BEBD", "#E3D4DA",
        "#E6AECD", "#EA9895", "#A6CAE5", "#45A8C1", "#F4DA94", "#77A6F6"],
    "gradients": [
        ["#88CAFD", "#1986F1"], ["#A276FF", "#662BFF"], ["#F983ED", "#F813D8"],
        ["#FEBC94", "#FC772F"], ["#769BFC", "#395BFA"], ["#7FFF7D", "#2CDC4D"]
    ],
    "emoji": {
        "max_shortname_length": 32,
        "max_filesize": 1024 * 256,
        "min_size": 32,
        "max_size": 128,
        "path": "/path/to/file",
        "regex": /^[0-9a-zA-Z_\-]+$/
    },
    "memcached": {
        "capacity": 1000,
        "max_age": 86400
    },
    "like": {
        "max_count": 10		// 投稿1つにつき何回まで「いいね」を押せるか
    },
    "account": {
        "max_num_accounts_per_ip_address": 30
    },
    "user": {
        "max_name_length": 32,
        "max_display_name_length": 32,
        "max_status_text_length": 32,
        "name_regexp": "[a-zA-Z0-9_]+",
        "reserved_names": [
            "admin", "beluga", "me", "here", "channel", "everyone", "api", "stats",
            "guest", "moderator", "user"
        ],
        "profile": {
            "background_image": {
                "max_size": 10000,
                "max_filesize": 1024 * 1024 * 5
            },
            "image_size": 128,
            "max_description_length": 10000,
            "max_location_length": 100,
            "max_num_tags": 100,
            "max_tag_length": 100,
            "default_theme_color": "#477da7"
        },
    },
    "channel": {
        "reserved_names": ["create_new_channel"],
        "max_name_length": 100,			// UTF16基準なので注意。サロゲートペアは2文字扱いになる
    },
    "community": {
        "name_regexp": "[a-zA-Z0-9_]+",
        "max_name_length": 32,				// UTF16基準なので注意
        "max_display_name_length": 100,		// UTF16基準なので注意
        "max_description_length": 1000, 	// UTF16基準なので注意
        "max_num_communities_user_can_create": 2,   // 一人当たりのコミュニティ作成の上限
        "profile": {
            "image_size": 300,
        },
        "channel": {
            "min_statuses_count_to_display": 10	// チャンネル一覧に表示される最低限の投稿数
        },
        "reserved_names": ["create_new_community", "user", "support", "explore", "search", "api", "singup", "login"],
    },
    "auth": {
        "salt": "salt",		// ここを運用開始後に変えるとログインができなくなるので注意
        "bcrypt_salt_round": 12,
        "password_regexp": /^[\x21-\x7E]+$/,	// asciiのみ
        "min_password_length": 4,
        "session": {
            "cookie_secret": "secret",	// ここを変えるとセッションが切れるので注意
            "cookie_name": "session_id",
            "secure": use_https,
            "max_age": 86400 * 7,			// 秒
            "timezone_offset": 9 * 3600		// 秒
        }
    },
    "timeline": {
        "max_count": 3000,
        "default_count": 30
    },
    "websocket": {
        "https": {
            "key": "/path/to/privkey.pem",
            "cert": "/path/to/fullchain.pem"
        }
    },
    "log": {
        "directory": "/path/to/log/dir"
    },
    "tmp": {
        "directory": "/path/to/tmp/dir"
    },
    "media": {
        "image": {
            "max_filesize": 1024 * 1024 * 10,
            "max_width": 20000,
            "max_height": 20000,
            "thumbnail": {
                "square_size": 300,
                "small_size": 800,
                "medium_size": 1600,
            }
        },
        "video": {
            "allowed_file_types": ["mp4", "mov", "webm"],
            "unsupported_codecs": ["MPEG-4 part 2"],
            "max_filesize": 1024 * 1024 * 200,
            "max_width": 3840,
            "max_height": 3840
        },
        "list": {
            "max_count": 500,       // 1回のAPIリクエストで取得できる上限
            "default_count": 20
        }
    }
}