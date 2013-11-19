var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

// define schema
var TagSchema = new Schema({
	name: { type: String },
	description: { type: String },
	sequence: {type: Number, default: 0 },
	created_at: { type: Date, default: Date.now }
});

// define model
mongoose.model('Tag', TagSchema);