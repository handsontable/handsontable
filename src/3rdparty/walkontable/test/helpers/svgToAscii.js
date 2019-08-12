export default async function svgToAscii(svg) {
  const xml = new XMLSerializer().serializeToString(svg);

  const scaleFactor = window.devicePixelRatio || 1;

  const img = document.createElement('img');
  // img.style.imageRendering = 'crisp-edges'; //FF
  // img.style.imageRendering = `pixelated`; //Ch
  img.style.width = `${svg.clientWidth}px`;
  img.style.height = `${svg.clientHeight}px`;

  return new Promise((resolve) => {
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.style.width = `${svg.clientWidth}px`;
      canvas.style.height = `${svg.clientHeight}px`;
      canvas.width = img.naturalWidth * scaleFactor;
      canvas.height = img.naturalHeight * scaleFactor;
      // canvas.style.imageRendering = 'crisp-edges'; //FF
      // canvas.style.imageRendering = `pixelated`; //Ch
      svg.parentNode.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        // SecurityError is thrown in IE, let's abandon
        return;
      }

      const art = imageToAscii(imageData, {
        contrast: 0, // range -255 to +255
        invert: false // invert brightness
      });

      resolve(art);
    };

    svg.parentNode.appendChild(img);

    img.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(xml)}`;
  });
}

// var characters = '.,:;i1tfLCG08@◼'.split('');
const characters = '▯▮'.split('');

function imageToAscii(imageData, options) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const bytesPerPixel = imageData.format === 'RGB24' ? 3 : 4;

  // calculate contrast factor
  // http://www.dfstudios.co.uk/articles/image-processing-algorithms-part-5/
  const contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));

  let ascii = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = ((y * width) + x) * bytesPerPixel;

      // pixel color at offset
      let r = data[offset];
      let g = data[offset + 1];
      let b = data[offset + 2];

      // increase the contrast of the image
      r = clamp((contrastFactor * (r - 128)) + 128, 0, 255);
      g = clamp((contrastFactor * (g - 128)) + 128, 0, 255);
      b = clamp((contrastFactor * (b - 128)) + 128, 0, 255);

      // calculate pixel brightness
      // http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
      let brightness = ((0.299 * r) + (0.587 * g) + (0.114 * b)) / 255;

      if (!options.invert) brightness = 1 - brightness;

      ascii += characters[Math.round(brightness * (characters.length - 1))];
    }

    ascii += '\n';
  }

  return ascii.slice(0, -1);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
