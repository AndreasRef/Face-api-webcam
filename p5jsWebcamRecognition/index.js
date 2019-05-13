//See https://github.com/justadudewhohacks/face-api.js/issues/130

var capture;

function preload() {
    loadModelsAndCalculateDescriptors()
}

function setup() {
    let p5Canvas = createCanvas(640, 480);

    p5Canvas.id('p5Canvas');

    capture = createCapture(VIDEO);
    capture.hide();
  }
  
  function draw() {
    //background(220);
    //image(capture, 0, 0);
  }

let labeledFaceDescriptors;

async function loadModelsAndCalculateDescriptors() {
    const MODELS = "/models"; // Contains all the weights.

    //await faceapi.loadSsdMobilenetv1Model(MODELS)
    await faceapi.loadTinyFaceDetectorModel(MODELS)
    await faceapi.loadFaceLandmarkModel(MODELS)
    await faceapi.loadFaceRecognitionModel(MODELS)

    console.log("models loaded, calculating labeledFaceDescriptors")

    const labels = ['sheldon','howard', 'andreas', 'guy_with_hat']
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160 })


    labeledFaceDescriptors = await Promise.all(
        labels.map(async label => {
            //console.log("starting labeledFaceDescriptors function")

            // fetch image data from urls and convert blob to HTMLImage element
            const imgUrl = `${label}.jpg`
            const img = await faceapi.fetchImage(imgUrl)

            // detect the face with the highest score in the image and compute it's landmarks and face descriptor
            const fullFaceDescription = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()

            if (!fullFaceDescription) {
                throw new Error(`no faces detected for ${label}`)
            }

            const faceDescriptors = [fullFaceDescription.descriptor]
            
            return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
        })     
    )
    console.log("Calculated all labeledFaceDescriptors ")

    // try to access users webcam and stream the images
    // to the video element
    const videoEl = document.getElementById('inputVideo')

    navigator.getUserMedia(
        { video: {} },
        stream => videoEl.srcObject = stream,
        err => console.error(err)
    )
    console.log("Starting video")
}

async function recognise() {

        const input = document.getElementById('inputVideo')
        const fullFaceDescriptions = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()

        // 0.6 is a good distance threshold value to judge
        // whether the descriptors match or not
        const maxDescriptorDistance = 0.6
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance)
        //console.log("face matcher"+faceMatcher)
        const results = fullFaceDescriptions.map(fd => faceMatcher.findBestMatch(fd.descriptor))


        const boxesWithText = results.map((bestMatch, i) => {
            const box = fullFaceDescriptions[i].detection.box
            const text = bestMatch.toString()
            const boxWithText = new faceapi.BoxWithText(box, text)
            //console.log(box._x)
            return boxWithText
        })

        //let myCanvas = document.getElementById('p5Canvas');
        //const context = myCanvas.getContext('2d');
        //context.clearRect(0, 0, myCanvas.width, myCanvas.height);
        image(capture, 0, 0);

        faceapi.drawDetection(p5Canvas, boxesWithText)
        //document.getElementById('inputVideo').style.display = "none";
}

async function onPlay(videoEl) {
    await recognise()
    setTimeout(() => onPlay(videoEl))
} 



