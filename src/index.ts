require('reflect-metadata');

const slug = require('mongoose-slug-generator');

import mongoose = require('mongoose');

mongoose.Promise = Promise;
mongoose.plugin(slug);


export * from './model';
export * from './annotations';
export * from 'mongoose';