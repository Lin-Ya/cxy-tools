import Cookies from "js-cookie"
import axios from "axios"

function getToken() {
    return Cookies.get("Admin-Token")
}

axios.defaults.headers["Content-Type"] = "application/json;charset=utf-8"

// 创建axios实例
const request = axios.create({
    timeout: 100000,
    // withCredentials: true,
    hedears: {
        Authorization: "Bearer " + getToken(),
    },
})

// request拦截器
request.interceptors.response.use(
    (response) => {
        return response.data
    },
    (error) => {
        if (error.response.status === 401) {
            // 401 清除token信息并跳转到登录页面
            Cookies.remove("Admin-Token")
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export { request }
