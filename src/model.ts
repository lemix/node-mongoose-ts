import mongoose = require('mongoose');
import { MetadataSymbols } from './annotations';
import { defineSchema, defineModel } from './helpers'

interface ISchemaCollection {
    [prop: string]: mongoose.Schema;
}

interface IModelCollection {
    [prop: string]: mongoose.Model<mongoose.Document>;
}

export interface IModelBase {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    slug?: string;
}

export interface IListOptions {
    skip?: number;
    limit?: number;
}

export enum SordDirection {
    Ascending = 1,
    Descending = -1
}

export type IListOrdering<T> = Array<[keyof (T & IModelBase), SordDirection]>;


export abstract class ModelBase<T> {
    private static schemas: ISchemaCollection = {};
    private static models: IModelCollection = {};
    _raw: Object;
    _document: mongoose.Document;

    public get _id(): mongoose.Types.ObjectId {
        return (this._document || this._raw)['_id'];
    };

    public get id(): string {
        return this._id.toHexString();
    };

    public set id(value: string) {
        (this._document || this._raw)['_id'] = new mongoose.Types.ObjectId(value);
    };

    get createdAt(): Date {
        return (this._document || this._raw)['createdAt'];
    };

    get updatedAt(): Date {
        return (this._document || this._raw)['updatedAt'];
    };

    get slug(): string {
        return (this._document || this._raw)['_slug'];
    }

    constructor(obj?: T | mongoose.Document | mongoose.Types.Embedded) {
        if (obj && (obj instanceof mongoose.Model || obj instanceof mongoose.Types.Embedded)) {
            this._document = <T & mongoose.Document>obj;
        } else {
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

            } else if (model) {
                this._document = new model();
            }
            else {
                this._raw = {};
            }
        }

        this._passDocument();
    }

    public static getModel<T>(): mongoose.Model<T & mongoose.Document> {
        return <mongoose.Model<T & mongoose.Document>>ModelBase.models[this.name];
    }

    public static getSchema() {
        let schema = ModelBase.schemas[this.name];

        if (!schema) {
            defineSchema(this.prototype.constructor);
            schema = ModelBase.schemas[this.name];
        }

        return schema;
    }

    /* Static methods */

    public static remove<T>(conditions: Object): Promise<any> {
        let model = this.getModel();
        return model.remove(conditions).exec();
    }

    public static findById<T>(id: string | mongoose.Types.ObjectId): Promise<T> {
        return this.getModel().findById(id).exec().then<T>((doc) => {
            if (doc) {
                return <T>(new (<any>this)(doc));
            }
            return null;
        })
    }

    public static findBySlug<T>(slug: string): Promise<T> {
        return this.getModel().findOne({ _slug: slug }).exec().then<T>((doc) => {
            if (doc) {
                return <T>(new (<any>this)(doc));
            }
            return null;
        })
    }

    public static list<T>(conditions: Object, ordering?: IListOrdering<T>,
        options?: IListOptions): Promise<T[]> {
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
                return <T>(new (<any>this)(doc));
            });
        });
    }

    /* Public instance methods */

    public toJSON(): any {
        this._bindToDocument();
        let doc = this.getDocument();
        return doc;
    }

    public getSchema() {
        let name = this.constructor.name;
        let schema = ModelBase.schemas[name];

        if (!schema) {
            defineSchema(this['prototype']);
            schema = ModelBase.schemas[name];
        }

        return schema;
    }

    public getModel(): mongoose.Model<T & mongoose.Document> {
        let model = ModelBase.models[this.constructor.name];
        return <mongoose.Model<T & mongoose.Document>>model;
    }

    public getDocument(): T & mongoose.Document {
        this._bindToDocument();
        return <T & mongoose.Document>this._document;
    }

    public remove(): Promise<this> {
        return this._document.remove().then((doc) => {
            return this;
        });
    }

    public save(): Promise<this> {
        this._bindToDocument();
        return this._document.save().then(() => {
            return this;
        });
    }

    public bindDocument(doc: mongoose.Document) {
        this._document = doc;
        this._passDocument();
    }

    /* Private instance methods */

    private _bindToDocument(): void {
        if (!this._document) {
            let model = this.getModel();
            this._document = model.hydrate(this._raw);
        }

        let schema = this.getSchema();

        for (let key in schema.obj) {
            if (this.hasOwnProperty(key) || Object.getPrototypeOf(this).hasOwnProperty(key)) {
                let embeded = Reflect.getMetadata(MetadataSymbols.EmbededModelSymbol, this.constructor, key);
                
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
                    
                } else if (this[key]) {
                    let dstObj = this._document[key] = {};
                    let srcObj = this[key];

                    for (let key in embeded.getSchema().obj) {
                        dstObj[key] = srcObj[key];
                    }
                }
            }
        }
    }

    private _passDocument(): void {
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

            let embeded = Reflect.getMetadata(MetadataSymbols.EmbededModelSymbol, this.constructor, key);

            if (embeded) {
                if (Array.isArray(this._document[key])) {
                    this[key] = this._document[key].map(doc => {
                        return new embeded(doc);
                    })
                } else if (this._document[key]) {
                    this[key] = new embeded(this._document[key]);
                }
            }
            else {
                this[key] = this._document[key];
            }
        }
    }
}