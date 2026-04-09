import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
try {
  const models = await client.listModels();
  console.log('models', models.length);
  console.log(models.map(x=>x.name).slice(0,20));
} catch (e) {
  console.error('listModels error', e);
}
