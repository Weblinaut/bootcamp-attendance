import { Client } from './client';

async function main() {
  let client = new Client("April 13, 2019 10:01:00", false);
  try {
    await client.login();
    await client.attendancePoll()
    console.log(client.missingStudentList)
    // Notifier.send(client.missingStudentList)
  } catch (error) {
      console.log('a bad thing happened: ', error)
  }
}

main();
