const {
    Controller
} = require('uni-cloud-router')
module.exports = class MenuController extends Controller {
    constructor(ctx) {
        super(ctx)
        this.menuService = this.service.system.menu
    }
    async list() {
        return this.menuService.list()
    }
    async add() {
        return this.menuService.add(this.ctx.data)
    }
    async update() {
        return this.menuService.update(this.ctx.data)
    }
    async delete() {
        return this.menuService.delete(this.ctx.data.id)
    }
}
