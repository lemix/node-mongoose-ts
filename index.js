'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var mongoose$1 = require('mongoose');

function defineSchema(target) {
    let name = target.name;
    let proto = Object.getPrototypeOf(target);
    let schema = Reflect.getMetadata(exports.MetadataSymbols.SchemaDefinationSymbol, target) || {};
    let opts = Reflect.getMetadata(exports.MetadataSymbols.ModelOptionsSymbol, target) || {};
    let modelName = Reflect.getMetadata(exports.MetadataSymbols.ModelNameSymbol, target);
    if (opts.slug) {
        schema._slug = { type: String, slug: opts.slug, slug_padding_size: 3, unique: true };
    }
    if (modelName) {
        schema.createdAt = {
            type: mongoose.Schema.Types.Date,
            required: true,
            index: true
        };
        schema.updatedAt = {
            type: mongoose.Schema.Types.Date,
            required: true,
            index: true
        };
    }
    proto.schemas[name] = new mongoose.Schema(schema);
    if (modelName) {
        proto.schemas[name].pre('validate', function (next) {
            this['updatedAt'] = new Date();
            if (this.isNew || typeof this['createdAt'] === 'undefined') {
                this['createdAt'] = new Date();
            }
            next();
        });
    }
}
function defineModel(target) {
    let name = target.name;
    let modelName = Reflect.getMetadata(exports.MetadataSymbols.ModelNameSymbol, target);
    let proto = Object.getPrototypeOf(target);
    proto.models[name] = mongoose.model(modelName, proto.schemas[name]);
}
function asEmbededModel(opts) {
    if (isModel(opts))
        return { opts: opts.getSchema(), model: opts };
    if (isModel(opts.type)) {
        let model = opts.type;
        opts.type = opts.type.getSchema();
        return { opts: opts, model: model };
    }
    if (Array.isArray(opts) && isModel(opts[0]))
        return { opts: [opts[0].getSchema()], model: opts[0] };
    if (Array.isArray(opts.type) && isModel(opts.type[0])) {
        let model = opts.type[0];
        opts.type[0] = opts.type[0].getSchema();
        return { opts: opts, model: model };
    }
    return null;
}
function isModel(obj) {
    if (obj) {
        let proto = Object.getPrototypeOf(obj);
        if (proto === ModelBase)
            return true;
    }
    return false;
}

(function (MetadataSymbols) {
    MetadataSymbols.ModelOptionsSymbol = Symbol.for("model:options");
    MetadataSymbols.SchemaDefinationSymbol = Symbol.for("model:schema");
    MetadataSymbols.ModelNameSymbol = Symbol.for("model:name");
    MetadataSymbols.EmbededModelSymbol = Symbol.for("model:embeded");
})(exports.MetadataSymbols || (exports.MetadataSymbols = {}));
function DataModel(param) {
    if (typeof param === 'function' && Object.is(Object.getPrototypeOf(param), ModelBase)) {
        Reflect.defineMetadata(exports.MetadataSymbols.ModelNameSymbol, param.name.replace(/(.*)(model|schema)$/i, '$1'), param.prototype.constructor);
        defineSchema(param.prototype.constructor);
        defineModel(param.prototype.constructor);
        return;
    }
    if (param) {
        return function (target) {
            Reflect.defineMetadata(exports.MetadataSymbols.ModelOptionsSymbol, param, target);
            return DataModel(target);
        };
    }
}
function DataField(opts) {
    return (target, propertyKey) => {
        let embeded = asEmbededModel(opts);
        let schema = Reflect.getMetadata(exports.MetadataSymbols.SchemaDefinationSymbol, target.constructor) || {};
        if (embeded) {
            opts = embeded.opts;
            Reflect.defineMetadata(exports.MetadataSymbols.EmbededModelSymbol, embeded.model, target.constructor, propertyKey);
        }
        schema[propertyKey] = opts;
        Reflect.defineMetadata(exports.MetadataSymbols.SchemaDefinationSymbol, schema, target.constructor);
    };
}

(function (SordDirection) {
    SordDirection[SordDirection["Ascending"] = 1] = "Ascending";
    SordDirection[SordDirection["Descending"] = -1] = "Descending";
})(exports.SordDirection || (exports.SordDirection = {}));
class ModelBase {
    constructor(obj) {
        if (obj && (obj instanceof mongoose.Model || obj instanceof mongoose.Types.Embedded)) {
            this._document = obj;
        }
        else {
            let model = this.getModel();
            if (obj && typeof obj === "object" && Object.keys(obj).length > 0) {
                if (typeof obj['id'] === 'string') {
                    obj['_id'] = mongoose.Types.ObjectId.createFromHexString(obj['id']);
                }
                if (typeof obj['_id'] === 'string') {
                    obj['_id'] = mongoose.Types.ObjectId.createFromHexString(obj['_id']);
                }
                if (typeof obj['createdAt'] === 'string') {
                    obj['createdAt'] = new Date(obj['createdAt']);
                }
                if (typeof obj['updatedAt'] === 'string') {
                    obj['updatedAt'] = new Date(obj['updatedAt']);
                }
                if (typeof obj['slug'] === 'string') {
                    obj['_slug'] = obj['slug'];
                }
                this._raw = obj;
            }
            else if (model) {
                this._document = new model();
            }
            else {
                this._raw = {};
            }
        }
        this._passDocument();
    }
    get _id() {
        return (this._document || this._raw)['_id'];
    }
    ;
    get id() {
        return this._id.toHexString();
    }
    ;
    set id(value) {
        (this._document || this._raw)['_id'] = new mongoose.Types.ObjectId(value);
    }
    ;
    get createdAt() {
        return (this._document || this._raw)['createdAt'];
    }
    ;
    get updatedAt() {
        return (this._document || this._raw)['updatedAt'];
    }
    ;
    get slug() {
        return (this._document || this._raw)['_slug'];
    }
    static getModel() {
        return ModelBase.models[this.name];
    }
    static getSchema() {
        let schema = ModelBase.schemas[this.name];
        if (!schema) {
            defineSchema(this.prototype.constructor);
            schema = ModelBase.schemas[this.name];
        }
        return schema;
    }
    static remove(conditions) {
        let model = this.getModel();
        return model.remove(conditions).exec();
    }
    static findById(id) {
        return this.getModel().findById(id).exec().then((doc) => {
            if (doc) {
                return (new this(doc));
            }
            return null;
        });
    }
    static findBySlug(slug) {
        return this.getModel().findOne({ _slug: slug }).exec().then((doc) => {
            if (doc) {
                return (new this(doc));
            }
            return null;
        });
    }
    static list(conditions, ordering, options) {
        let model = this.getModel();
        let query = model.find(conditions);
        if (options && options.limit > 0)
            query.limit(options.limit);
        if (options && options.skip > 0)
            query.skip(options.skip);
        if (Array.isArray(ordering) && ordering.length > 0)
            query.sort(ordering);
        return query.exec().then((docs) => {
            return docs.map((doc) => {
                return (new this(doc));
            });
        });
    }
    toJSON() {
        this._bindToDocument();
        let doc = this.getDocument();
        return doc;
    }
    getSchema() {
        let name = this.constructor.name;
        let schema = ModelBase.schemas[name];
        if (!schema) {
            defineSchema(this['prototype']);
            schema = ModelBase.schemas[name];
        }
        return schema;
    }
    getModel() {
        let model = ModelBase.models[this.constructor.name];
        return model;
    }
    getDocument() {
        this._bindToDocument();
        return this._document;
    }
    remove() {
        return this._document.remove().then((doc) => {
            return this;
        });
    }
    save() {
        this._bindToDocument();
        return this._document.save().then(() => {
            return this;
        });
    }
    bindDocument(doc) {
        this._document = doc;
        this._passDocument();
    }
    _bindToDocument() {
        if (!this._document) {
            let model = this.getModel();
            this._document = model.hydrate(this._raw);
        }
        let schema = this.getSchema();
        for (let key in schema.obj) {
            if (this.hasOwnProperty(key) || Object.getPrototypeOf(this).hasOwnProperty(key)) {
                let embeded = Reflect.getMetadata(exports.MetadataSymbols.EmbededModelSymbol, this.constructor, key);
                if (!embeded) {
                    this._document[key] = this[key];
                    continue;
                }
                if (Array.isArray(this[key])) {
                    let value = this[key].map(doc => {
                        let embededObj = {};
                        for (let key in embeded.getSchema().obj) {
                            embededObj[key] = doc[key];
                        }
                        return embededObj;
                    });
                    this._document[key] = value;
                }
                else if (this[key]) {
                    let dstObj = this._document[key] = {};
                    let srcObj = this[key];
                    for (let key in embeded.getSchema().obj) {
                        dstObj[key] = srcObj[key];
                    }
                }
            }
        }
    }
    _passDocument() {
        if (!this._document) {
            let model = this.getModel();
            this._document = model.hydrate(this._raw);
        }
        let schema = this.getSchema();
        for (let key in schema.obj) {
            if (typeof this._document[key] === 'undefined')
                continue;
            if (~['updatedAt', 'createdAt'].indexOf(key))
                continue;
            let embeded = Reflect.getMetadata(exports.MetadataSymbols.EmbededModelSymbol, this.constructor, key);
            if (embeded) {
                if (Array.isArray(this._document[key])) {
                    this[key] = this._document[key].map(doc => {
                        return new embeded(doc);
                    });
                }
                else if (this._document[key]) {
                    this[key] = new embeded(this._document[key]);
                }
            }
            else {
                this[key] = this._document[key];
            }
        }
    }
}
ModelBase.schemas = {};
ModelBase.models = {};

require('reflect-metadata');
const slug = require('mongoose-slug-generator');
mongoose.Promise = Promise;
mongoose.plugin(slug);

exports.ModelBase = ModelBase;
exports.DataModel = DataModel;
exports.DataField = DataField;
