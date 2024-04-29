import schedule from 'node-schedule';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Configure ffmpeg to use the static build
ffmpeg.setFfmpegPath(ffmpegPath);

// Parse arguments using yargs
const argv = yargs(hideBin(process.argv))
  .option('start', {
    alias: 's',
    describe: 'Start time of the recording (e.g., 19:00)',
    type: 'string',
    demandOption: true
  })
  .option('end', {
    alias: 'e',
    describe: 'End time of the recording (e.g., 21:00)',
    type: 'string',
    demandOption: true
  })
  .option('url', {
    alias: 'u',
    describe: 'URL of the live MP3 stream',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    describe: 'Output path for saving the recording',
    type: 'string',
    default: './'
  })
  .help()
  .argv;

let streamProcess;

// Parse time from arguments
function parseTime(timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
}

// Function to start recording
function startRecording() {
    const startTime = new Date();
    const fileName = `radio_show_${startTime.toISOString()}.mp3`;
    const outputFile = path.join(argv.output, fileName);
    console.log(`Recording started and will be saved to ${outputFile}`);

    streamProcess = ffmpeg(argv.url)
        .audioCodec('copy')
        .on('error', (err) => {
            console.error('An error occurred:', err.message);
        })
        .on('end', () => {
            console.log(`Recording saved as ${outputFile}`);
        })
        .saveToFile(outputFile);
}

// Function to stop recording
function stopRecording() {
    if (streamProcess) {
        streamProcess.kill('SIGINT');
        console.log('Recording stopped.');
    }
}

// Scheduling using parsed times
const startJobTime = parseTime(argv.start);
const stopJobTime = parseTime(argv.end);

// Schedule the recording start
schedule.scheduleJob({ ...startJobTime, dayOfWeek: 6, tz: 'America/New_York' }, startRecording);

// Schedule the recording stop
schedule.scheduleJob({ ...stopJobTime, dayOfWeek: 6, tz: 'America/New_York' }, stopRecording);

console.log(`Scheduler set up to start and stop recording on Saturdays from ${argv.start} to ${argv.end} Eastern Time.`);
