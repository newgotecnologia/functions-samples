# GCF FFmpeg convert to LINEAR16
This Cloud Function automatically creates a [LINEAR16](https://cloud.google.com/speech-to-text/docs/reference/rest/v1p1beta1/RecognitionConfig#audioencoding) converted copy of files uploaded to Google Cloud Storage. Intended to be compatible for usage with Google Cloud Speech-to-Text API.

The audio is converted to the [`s16le`](https://trac.ffmpeg.org/wiki/audio%20types) format and codec, with mono-channel audio @ 16000hz.

This function was based on the [ffmpeg-convert-audio](https://github.com/firebase/functions-samples/tree/master/ffmpeg-convert-audio) function sample from [firebase/functions-samples](https://github.com/firebase/functions-samples).

## Functions Code

See file [functions/index.js](functions/index.js) for the audio conversion code.

The audio is first downloaded locally from the Cloud Storage bucket to the `tmp/` folder using the [Node.js Client](https://googleapis.dev/nodejs/storage/latest/index.html). Then the audio is converted using FFmpeg and uploaded back to the bucket.

## Trigger rules

The function should be set to trigger on [upload of any file](https://cloud.google.com/functions/docs/calling/storage#object_finalize) to your Firebase project's default Cloud Storage bucket.

## Deploy and test

To deploy and test the function:

- Create a Firebase or Google Cloud project and [open the bucket](https://console.cloud.google.com/storage/browser/) which the function will subscribe to.
- Deploy the code by creating the function via Cloud Console or via the `gcloud` command line tool, see below.
- Upload a file to the bucket, [monitor your function logs](https://console.cloud.google.com/logs/viewer) and after the processing is over the bucket should have the converted file with a `_converted.pcm` suffix.

### Deploying via Cloud Console
1. Go to the [Create function](https://console.cloud.google.com/functions/add) page and choose your settings.
2. Copy and paste the code from [functions/index.js](functions/index.js) and [functions/package.json](functions/package.json) into their respective files.
3. Follow the instructions to deploy the function and monitor/test it. 

### Deploying via [`gcloud` command line tool](https://cloud.google.com/sdk/gcloud)
Be sure to have the tool configured to target the correct project.
1. Get the code, for instance using `git clone `.
2. Enter the correct directory `cd gfc-ffmpeg-linear16/`.
3. Deploy the function via the [`gcloud functions deploy`](https://cloud.google.com/sdk/gcloud/reference/functions/deploy) command with your settings.

## Notes

- Take into account that the audio files produced should not exceed the size of the memory of your function.
- The audio conversion could take a certain amount of time, increase the timeout of your function using the cloud functions webgui so the function can run for a longer time.
- When deploying, be sure to select the correct bucket, trigger, event type and a service account that has enough permission.
- Consider [making your function idempotent](https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions) to prevent wasting resources on repeated conversions.

## License

© Google, 2015-2020. 
Modifications © NewGo Tecnologia, 2020.
Licensed under an [Apache-2](LICENSE) license.