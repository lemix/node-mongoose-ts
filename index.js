"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
const mongoose = require("mongoose");
__export(require("mongoose"));
function DataModel(target) {
    let name = target.name.substr(-6).toLowerCase() === 'schema' ?
        target.name.substr(0, target.name.length - 6) : target.name;
    target.prototype.modelName = name;
}
exports.DataModel = DataModel;
function DataField(opts) {
    return (target, propertyKey) => {
        (target.schemaDefinition = target.schemaDefinition || {})[propertyKey] = opts;
    };
}
exports.DataField = DataField;
function StaticMember(target, propertyKey, descriptor) {
    (target.statics = target.statics || {})[propertyKey] = descriptor.value;
}
exports.StaticMember = StaticMember;
function InstanceMember(target, propertyKey, descriptor) {
    (target.methods = target.methods || {})[propertyKey] = descriptor.value;
}
exports.InstanceMember = InstanceMember;
class ModelSchema {
    constructor(options) {
        this.target = this;
        this.createSchema();
        this.addStaticsAndMethods();
        if (this.modelName)
            this.model = mongoose.model(this.modelName, this.schema);
    }
    getModel() {
        return this.model;
    }
    createSchema(options) {
        this.schema = new mongoose.Schema(this.target.schemaDefinition, options);
        delete this.target.schemaDefinition;
    }
    addStaticsAndMethods() {
        for (let key in this.target.statics) {
            this.schema.static(key, this.target[key]);
        }
        for (let key in this.target.methods) {
            this.schema.method(key, this.target[key]);
        }
        delete this.target.statics;
        delete this.target.methods;
    }
}
exports.ModelSchema = ModelSchema;
class ModelSchemaDefault extends ModelSchema {
}
exports.ModelSchemaDefault = ModelSchemaDefault;
//# sourceMappingURL=index.js.map