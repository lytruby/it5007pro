/* 
Test with asynchronous function
by running commonds:
mongo bookworm --eval "db.books.remove({})"
node scripts/trymongo.js
*/

const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost/bookworm';

  async function testWithAsync() {
    const client = new MongoClient(url, { useNewUrlParser: true });
    try {
      await client.connect();
      console.log('Connected to MongoDB');
      const db = client.db();
      const collection = db.collection('books');

      console.log('\n--- testAdd ---');
      const book_1 = {id:1,title:"B1",author:"cat",price:12.12,description:"a good book!",category:"cs",course:"IT5007",photo:"pic1",sellerid:"1"};
      
      const result_1 = await collection.insertOne(book_1);
      console.log('Result of insert:\n', result_1.insertedId);
      const docs_1 = await collection.find({ _id: result_1.insertedId })
        .toArray();
      console.log('Result of find:\n', docs_1);

      console.log('\n--- testRead ---');
      const book_2 = {id:2,title:"B2",author:"dog",price:6.6,description:"a good book too!",category:"cs",course:"IT5007",photo:"pic2",sellerid:"2"};
      const result_2 = await collection.insertOne(book_2);
      const docs_2 = await collection.find()
        .toArray();
      console.log('Adding id 2, result of reading the collection is:\n', docs_2);

      // console.log('\n--- testDelete ---');
      // const traveller_3 = { id: 3, name: 'testDelete', phone: '333', seat:30 };
      // const result_3 = await collection.insertOne(traveller_3);
      // const result_4 = await collection.remove({id: 2});
      // const docs_3 = await collection.find()
      //   .toArray();
      // console.log('After deleting id 2, result of the collection is:\n', docs_3);

    } catch(err) {
      console.log(err);
    } finally {
      client.close();
    }
  }
  
  testWithAsync()
