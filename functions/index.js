/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Modifications copyright 2020 NewGo Tecnologia
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const { Storage } = require('@google-cloud/storage');
const gcs = new Storage();
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Makes an ffmpeg command return a promise.
function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on('end', resolve).on('error', reject).run();
  });
}

/**
 * When an audio is uploaded in the Storage bucke, we generate a LINEAR16 automatically using
 * node-fluent-ffmpeg.
 */
exports.generateLinear16 = async (data, context, callback) => {
  const file = data;
  const fileBucket = file.bucket; // The Storage bucket that contains the file.
  const filePath = file.name; // File path in the bucket.
  const contentType = file.contentType; // File content type.
  
  console.log(`Processing file at gs://${fileBucket}/${filePath}`);

  // Exit if this is triggered on a file that is not an audio.
  if (!contentType.startsWith('audio/')) {
    console.log('This is not an audio.');
    callback();
    return;
  }

  // Get the file name.
  const fileName = path.basename(filePath);
  // Exit if the audio is already converted.
  if (fileName.endsWith('_converted.pcm')) {
    console.log('Already a converted audio.');
    callback();
    return;
  }

  // Download file from bucket.
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  // We replace the audio file extension name with a '.raw'. That's where we'll upload the converted audio.
  const targetTempFileName = fileName.replace(/\.[^/.]+$/, '') + '_converted.pcm';
  const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
  const targetStorageFilePath = path.join(path.dirname(filePath), targetTempFileName);

  await bucket.file(filePath).download({ destination: tempFilePath });
  console.log('Audio downloaded locally to', tempFilePath);
  
  // Convert the audio to LINEAR16 using FFMPEG.
  const command = ffmpeg(tempFilePath)
    .audioCodec('pcm_s16le')      // PCM signed 16-bit little-endian
    .format('s16le')              // PCM signed 16-bit little-endian
    .audioChannels(1)             // By default only the first channel is recognized
    .audioFrequency(16000)        // Optimal sample rate for Speech-to-Text API
    .output(targetTempFilePath);

  await promisifyCommand(command);
  console.log('Output audio created at', targetTempFilePath);

  // Uploading the audio.
  await bucket.upload(targetTempFilePath, { destination: targetStorageFilePath });
  console.log('Output audio uploaded to', targetStorageFilePath);

  // Once the audio has been uploaded delete the local file to free up disk space.
  fs.unlinkSync(tempFilePath);
  fs.unlinkSync(targetTempFilePath);
  console.log('Temporary files removed.', targetTempFilePath);

  callback();
};
