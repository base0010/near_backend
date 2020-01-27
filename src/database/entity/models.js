"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const user_1 = require("./user");
let Models = class Message {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: "Z_PK" })
], Models.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne(type => user_1.User),
    typeorm_1.JoinColumn({ name: "ZSENDER", referencedColumnName: "id" })
], Models.prototype, "sender", void 0);
__decorate([
    typeorm_1.Column({ name: "ZTEXT" })
], Models.prototype, "text", void 0);
Models = __decorate([
    typeorm_1.Entity("ZMESSAGE")
], Models);
exports.Message = Models;
//# sourceMappingURL=message.js.map
