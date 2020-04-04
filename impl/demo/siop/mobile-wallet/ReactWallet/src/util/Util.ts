import axios from 'axios';

async function doPostCall(data: any, url: string): Promise<any> {
  try {
    console.log ('Calling url: ' + url)
    const response = await axios.post(url, data);
    console.log('AXIOS RESPONSE: ');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log((error as Error).message, url);
    console.log((error as Error).name);
    console.log((error as Error).stack);
    throw error;
  }
}

export {
  doPostCall,
};