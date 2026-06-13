const { Admin } = require('./data/prismaDB');
const q = { nome: { $like: 'test@test.com%' } };
console.log('Original:', JSON.stringify(q));
Admin.findOne(q).catch(e => console.log('Error:', e.message));
