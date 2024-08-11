import pinecone from 'pinecone-client';

const apiKey = process.env.PINECONE_API_KEY; 
const environment = 'us-east1-gcp'; 

pinecone.init({ apiKey, environment });

export default pinecone;