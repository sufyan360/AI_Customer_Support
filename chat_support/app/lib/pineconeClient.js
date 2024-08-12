import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone(process.env.PINECONE_API_KEY)

async function initializePinecone() {

  const pinecone = Pinecone(api_key='95d7c854-743b-4eca-8065-6943edcc6c04');

  
  const indexName = 'chatbot';
  const indexExists = await pinecone.indexExists(indexName);

  if (!indexExists) {
    await pinecone.createIndex({
      name: indexName,
      dimension: 768, // Adjust dimension based on your model
    });
  }
}

export { pinecone, initializePinecone };