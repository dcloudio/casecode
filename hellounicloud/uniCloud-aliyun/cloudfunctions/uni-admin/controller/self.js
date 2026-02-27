const {
    Controller
} = require('uni-cloud-router')
const uniID = require('uni-id')
module.exports = class UserController extends Controller {
    async changePwd() {
        const data = this.ctx.data
        return uniID.updatePwd({
            uid: this.ctx.auth.uid,
            ...data
        })
    }
}
