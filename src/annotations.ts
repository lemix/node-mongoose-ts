import mongoose = require('mongoose');
import { ModelBase } from './model';
import { IEmbededModel, defineSchema, defineModel, asEmbededModel } from './helpers'

export namespace MetadataSymbols {
    export const ModelOptionsSymbol = Symbol.for("model:options");
    export const SchemaDefinationSymbol = Symbol.for("model:schema");
    export const ModelNameSymbol = Symbol.for("model:name");
    export const EmbededModelSymbol = Symbol.for("model:embeded");
}

export type SlugFunction = {
    (value: string): string;
}

export interface IDataModelOptions {
    slug: string | SlugFunction;
}

export type DataModelOptions = {
    [prop in keyof IDataModelOptions]: IDataModelOptions[prop];
}

export function DataModel(options?: DataModelOptions): (target: Function) => any;
export function DataModel(target: Function): any;
export function DataModel(param: DataModelOptions | Function): any {
    if (typeof param === 'function' && Object.is(Object.getPrototypeOf(param), ModelBase)) {
        Reflect.defineMetadata(MetadataSymbols.ModelNameSymbol, param.name.replace(/(.*)(model|schema)$/i, '$1'), param.prototype.constructor);
        defineSchema(param.prototype.constructor);
        defineModel(param.prototype.constructor);
        return;
    }
    if (param) {
        return function (target: Function) {
            Reflect.defineMetadata(MetadataSymbols.ModelOptionsSymbol, param, target);
            return DataModel(target);
        }
    }
}

export function DataField(opts: mongoose.SchemaTypeOpts<any>): (target, propertyKey: string) => void {
    return (target, propertyKey) => {
        let embeded: IEmbededModel = asEmbededModel(opts);
        let schema: any = Reflect.getMetadata(MetadataSymbols.SchemaDefinationSymbol, target.constructor) || {};
        
        if(embeded) {
            opts = embeded.opts;
            Reflect.defineMetadata(MetadataSymbols.EmbededModelSymbol, embeded.model, target.constructor, propertyKey);
        }

        schema[propertyKey] = opts;
        Reflect.defineMetadata(MetadataSymbols.SchemaDefinationSymbol, schema, target.constructor);
    }
}