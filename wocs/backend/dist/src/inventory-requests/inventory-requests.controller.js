"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryRequestsController = void 0;
const common_1 = require("@nestjs/common");
const inventory_requests_service_1 = require("./inventory-requests.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let InventoryRequestsController = class InventoryRequestsController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(body, req) {
        return this.service.create({
            ...body,
            requestedById: req.user.id,
        });
    }
    findAll(req) {
        return this.service.findAll(req.user);
    }
    approve(id, req) {
        return this.service.approve(id, req.user);
    }
    reject(id, req) {
        return this.service.reject(id, req.user);
    }
    confirmReceived(id, req) {
        return this.service.confirmReceived(id, req.user);
    }
};
exports.InventoryRequestsController = InventoryRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('IT_ADMINISTRATOR', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)('CLIENT_USER', 'IT_ADMINISTRATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)('CLIENT_USER', 'IT_ADMINISTRATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/received'),
    (0, roles_decorator_1.Roles)('IT_ADMINISTRATOR', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryRequestsController.prototype, "confirmReceived", null);
exports.InventoryRequestsController = InventoryRequestsController = __decorate([
    (0, common_1.Controller)('inventory-requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [inventory_requests_service_1.InventoryRequestsService])
], InventoryRequestsController);
//# sourceMappingURL=inventory-requests.controller.js.map