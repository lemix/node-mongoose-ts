import mongoose = require('mongoose');

export * from 'mongoose';

export function DataModel(target: Function): void {
    let name = target.name.substr(-6).toLowerCase() === 'schema' ? 
        target.name.substr(0, target.name.length - 6) : target.name;
    target.prototype.modelName = name;
}

export function DataField(opts: mongoose.SchemaTypeOpts<any>): (target, propertyKey: string) => void {
    return (target, propertyKey) => {
        (target.schemaDefinition = target.schemaDefinition || {})[propertyKey] = opts;
    }
}

export function StaticMember(target, propertyKey: string, descriptor: PropertyDescriptor) {
    (target.statics = target.statics || {})[propertyKey] = descriptor.value;
}

export function InstanceMember(target, propertyKey: string, descriptor: PropertyDescriptor) {
    (target.methods = target.methods || {})[propertyKey] = descriptor.value;
}

export abstract class ModelSchema<T, U> {
    schema: mongoose.Schema;
    modelName?: string;
    model?: mongoose.Model<T & mongoose.Document>;

    private target: any;

    constructor(options?: mongoose.SchemaOptions) {
        this.target = this;
        this.createSchema();
        this.addStaticsAndMethods();

        if(this.modelName)
            this.model = mongoose.model<T & mongoose.Document, mongoose.Model<T & mongoose.Document>>(
                this.modelName, this.schema);
    }

    public getModel(): U & mongoose.Model<T & mongoose.Document> {
        return <U & mongoose.Model<T & mongoose.Document>>this.model;
    }

    private createSchema(options?: mongoose.SchemaOptions) {
        this.schema = new mongoose.Schema(this.target.schemaDefinition, options);
        delete this.target.schemaDefinition;
    }

    private addStaticsAndMethods() {
        for(let key in this.target.statics) {
            this.schema.static(key, this.target[key]);
        }

        for(let key in this.target.methods) {
            this.schema.method(key, this.target[key]);
        }
        delete this.target.statics;
        delete this.target.methods;
    }
}

export abstract class ModelSchemaDefault extends ModelSchema<mongoose.Document, {}> {}
