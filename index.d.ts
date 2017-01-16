/// <reference types="mongoose" />
import mongoose = require('mongoose');
export * from 'mongoose';
export declare function DataModel(target: Function): void;
export declare function DataField(opts: mongoose.SchemaTypeOpts<any>): (target, propertyKey: string) => void;
export declare function StaticMember(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export declare function InstanceMember(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export declare abstract class ModelSchema<T, U> {
    schema: mongoose.Schema;
    modelName?: string;
    model?: mongoose.Model<T & mongoose.Document>;
    private target;
    constructor(options?: mongoose.SchemaOptions);
    getModel(): U & mongoose.Model<T & mongoose.Document>;
    private createSchema(options?);
    private addStaticsAndMethods();
}
export declare abstract class ModelSchemaDefault extends ModelSchema<mongoose.Document, {}> {
}
