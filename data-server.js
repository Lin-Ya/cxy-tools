const http = require("http")
const https = require("https")
const url = require("url")

const jsonData = {
    code: 200,
    message: "success",
    data: {
        pageSize: 50,
        pageNo: 1,
        recordsTotal: 120,
        data: [
            { id: 1, name: "hello", image: "https://picsum.photos/200/300" },
            {
                id: 11,
                name: "有子表ok",
                image: "https://picsum.photos/200/300",
                items: [
                    { id: 1, name: "子表1", image: "https://picsum.photos/200/300" },
                    { id: 2, name: "子表2", image: "https://picsum.photos/200/300" },
                ],
            },
            {
                id: 2,
                name: "world",
                image: "https://picsum.photos/200/301",
                children: [
                    {
                        id: 3,
                        name: "child 1",
                        image: "https://picsum.photos/200/302",
                        children: [
                            {
                                id: 41,
                                name: "child 1-1",
                                image: "https://picsum.photos/200/303",
                            },
                        ]
                    },
                    {
                        id: 4,
                        name: "child 2",
                        image: "https://picsum.photos/200/303",
                    },
                ],
            },
            {
                id: 6,
                name: "hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4hello4",
                image: "https://picsum.photos/200/300",
            },
            { id: 5, name: "hello5", image: "https://picsum.photos/200/300" },
        ],
        orders: null,
    },
}

const server = http.createServer((req, res) => {
    // 解析请求路径
    const parsedUrl = url.parse(req.url, true)

    // 设置跨域头部
    res.setHeader("Access-Control-Allow-Origin", "*") // 允许所有来源
    res.setHeader("Access-Control-Allow-Methods", "GET") // 允许的请求方法
    res.setHeader("Access-Control-Allow-Headers", "Content-Type") // 允许的请求头
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization") // 允许的请求头

    // 处理预检请求（OPTIONS请求）
    if (req.method === "OPTIONS") {
        res.writeHead(200)
        res.end()
        return
    }

    // 处理路由
    if (parsedUrl.pathname === "/api/data" && req.method === "GET") {
        // 设置响应头
        res.setHeader("Content-Type", "application/json")

        // 返回JSON数据
        res.end(JSON.stringify(jsonData))
    } else if (parsedUrl.pathname === "/api/add" && req.method === "POST") {
        // 设置响应头
        res.setHeader("Content-Type", "application/json")

        // 返回JSON数据
        res.end(
            JSON.stringify({
                code: 200,
                message: "添加 xx 成功",
            })
        )
    } else if (parsedUrl.pathname === "/api/delete" && req.method === "POST") {
        // 设置响应头
        res.setHeader("Content-Type", "application/json")

        // 返回JSON数据
        res.end(
            JSON.stringify({
                code: 200,
                message: "删除 123 成功",
            })
        )
    } else if(parsedUrl.pathname === "/api/options1" && req.method === "GET" ) {
        res.setHeader("Content-Type", "application/json")

        const options1 = [
            { label: '选项1', value: 1 },
            { label: '选项2', value: 2 },
        ]
        // 返回JSON数据
        res.end(
            JSON.stringify({
                code: 200,
                message: "获取 options1 成功",
                data: options1
            })
        )
    } else {
        // 处理未知路由
        res.statusCode = 404
        res.end(JSON.stringify({ code: 404, message: "Not Found" }))
    }
})

// 获取发布版本
const getVersion = () => {
    return new Promise((resolve, reject) => {
        https
            .get("https://registry.npmmirror.com/cxy-tools", (res) => {
                let data = ""
                res.on("data", (chunk) => {
                    data += chunk
                })
                res.on("end", () => {
                    resolve(JSON.parse(data)['dist-tags'].latest)
                })
            })
            .on("error", (err) => {
                reject(err)
            })
    })
}

// 启动服务器
const PORT = process.env.PORT || 3333
server.listen(PORT, async () => {
    const version = await getVersion()
    
    // https://registry.npmmirror.com/cxy-tools
    console.log(`Server is running on port 
    http://localhost:${PORT}
    当前发布版本：${version}
    `)
})
