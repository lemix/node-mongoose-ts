import mongoose = require('mongoose');
import { ModelBase } from './model';
import { DataModelOptions, MetadataSymbols } from './annotations';

export interface IEmbededModel {
    opts: mongoose.SchemaTypeOpts<any>;
    model: ModelBase<any>;
}

/**
 * Save schema describe in metadata
 * Set base model schema hooks
 */
export function defineSchema(target: any) {
    let name = target.name;
    let proto = Object.getPrototypeOf(target);
    let schema: mongoose.SchemaDefinition = Reflect.getMetadata(MetadataSymbols.SchemaDefinationSymbol, target) || {};
    let opts: DataModelOptions = Reflect.getMetadata(MetadataSymbols.ModelOptionsSymbol, target) || {};
    let modelName = Reflect.getMetadata(MetadataSymbols.ModelNameSymbol, target);

    if(opts.slug) {
        schema._slug = { type: String, slug: opts.slug, slug_padding_size: 3, unique: true }
    }

    if(modelName) {
        schema.createdAt = {
            type: mongoose.Schema.Types.Date,
            required: true,
            index: true
        }

        schema.updatedAt = {
            type: mongoose.Schema.Types.Date,
            required: true,
            index: true
        }
    }

    proto.schemas[name] = new mongoose.Schema(schema);

    if(modelName) {
        proto.schemas[name].pre('validate', function(this: mongoose.Document, next) {
            this['updatedAt'] = new Date();

            if(this.isNew || typeof this['createdAt'] === 'undefined') {
                this['createdAt'] = new Date();
            }
            next();
        });
    }
}

/**
 * Create mongoose model from schema 
 */
export function defineModel(target: any) {
    let name = target.name;
    let modelName = Reflect.getMetadata(MetadataSymbols.ModelNameSymbol, target);
    let proto = Object.getPrototypeOf(target);
    proto.models[name] = mongoose.model(modelName, proto.schemas[name]);
}

/**
 * Check for embeded model
 */
export function asEmbededModel(opts): IEmbededModel {
    if(isModel(opts))
        return { opts: opts.getSchema(), model: opts };

    if(isModel(opts.type)) {
        let model = opts.type;
        opts.type = opts.type.getSchema();
        return { opts: opts, model: model };
    }

    if(Array.isArray(opts) && isModel(opts[0]))
        return { opts: [opts[0].getSchema()], model: opts[0] };

    if(Array.isArray(opts.type) && isModel(opts.type[0])){
        let model = opts.type[0];
        opts.type[0] = opts.type[0].getSchema();
        return { opts: opts, model: model };
    }

    return null;
}

/**
 * Check for model
 */
export function isModel(obj: any): Boolean {
    if(obj) {
        let proto = Object.getPrototypeOf(obj);
        if(proto === ModelBase)
            return true;
    }
    return false;
}