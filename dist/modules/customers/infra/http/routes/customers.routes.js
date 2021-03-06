"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var CustomersController_1 = __importDefault(require("../controller/CustomersController"));
var customersRouter = express_1.Router();
var customersController = new CustomersController_1.default();
customersRouter.post('/', customersController.create);
exports.default = customersRouter;
