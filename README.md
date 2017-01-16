# Mongoose model declaration with Typescript

This module is a nice way to declare mongoose models in typescript. 
* It provides an implementation of the model interface, including inheritance on the mongoose model.
* It provides an interface of static methods, including inheritance on the mongoose model.

# Installation

```
npm install node-mongoose-ts --save
```

```
npm install @types/node-mongoose-ts --save-dev
```

# Usage

## Model declaration

1. Import node-mongoose-ts module:

```typescript
import { 
    Model, 
    Schema, 
    Document, 
    SchemaOptions,
    ModelSchema, 
    ModelSchemaDefault, 
    DataModel, 
    DataField, 
    StaticMember, 
    InstanceMember } = require('node-mongoose-ts');
```

2. Declare model interface

```typescript
interface IExample {
    id: string;
    exampleProp1: string;
    exampleProp2: Array<Schema.Types.ObjectId>;

    exampleMethod(input: string): void;
}
```

3. Declate interface for static methods

```typescript
interface IExampleStatics {
    exampleStaticMethod(input: string): void;
}
```

4. Declare model with implements model interface and static methods interface

```typescript
@DataModel
class ExampleSchema extends ModelSchema<IExample, IExampleStatics> implements IExample, IExampleStatics {
    constructor(options?: SchemaOptions) {
        super(options);
    }

    id: string;

    @DataField({ required: true, type: Schema.Types.String, index: true })
    exampleProp1: string;

    @DataField([Schema.Types.ObjectId])
    exampleProp2: Array<Schema.Types.ObjectId>;

    @InstanceMember
    exampleMethod(this: IExample & Document, input: string): any {
        return this;
    }
    
    @StaticMember
    exampleStaticMethod(this: IExampleStatics & Model<IExample & Document>, input: string): any {
        return this;
    } 
}
```

5. Export model

```typescript
let model = (new ProductSchema()).getModel();

export { model as ExampleModel };

```

## Usage declared model

```typescript
import { ExampleModel } = required('../path/to/example-model');

// Execute static method
ExampleModel.exampleStaticMethod('Hello World');

// Access to instance fields and execute instance method 
let example = new ExampleModel();
example.exampleMethod('Hello World');
console.log(example.exampleProp1);
```
