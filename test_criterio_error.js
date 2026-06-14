const { Criterio } = require('./data/db-adapter');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const res = await Criterio.find();
    console.log("Found:", res.length);
  } catch(e) {
    console.error("ERROR in find:", e);
  }
}
test();
