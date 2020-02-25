import uuidv1 from 'uuid/v1';

function getRandomString(): string {
  return uuidv1()
}

export { getRandomString };