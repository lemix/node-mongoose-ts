# Mongoose model declaration with Typescript

This module is a nice way to declare mongoose models in typescript. 
* It provides an implementation of the model interface, including inheritance on the mongoose model.
* It provides an interface of static methods, including inheritance on the mongoose model.

# Installation

```
npm install node-mongoose-ts --save
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
    InstanceMember } from 'node-mongoose-ts';
```

2. Declare model interface

```typescript
interface IExample {
    exampleProp1: string;
    exampleProp2: Array<number>;
}
```

3. Declare model

```typescript
@DataModel({ slug: "exampleProp1" })
class ExampleSchema extends ModelSchema<IExample> implements IExample {
    @DataField({ required: true, type: Schema.Types.String, index: true })
    exampleProp1: string;

    @DataField([Schema.Types.Number])
    exampleProp2: Array<number>;
}
```

## Usage declared model

```typescript
import { ExampleModel } = required('../path/to/example-model');

let myInst = new ExampleModel({
    exampleProp1: "Hello World",
    exampleProp2: 1
});

myInst.save().then(savedInst => {
    console.log(`Successfully saved with slug=${savedInst.slug}`); // Print: Successfully saved with slug=hello-world
});
```
