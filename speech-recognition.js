let recognizer;
let listening = false;
let lastRecognizedNumber = null;

const numberWords = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];

// individual thresholds for recognition
const numberThresholds = {
  zero: 0.99,
  one: 0.99,
  two: 0.99,
  three: 0.95,
  four: 0.999,
  five: 0.99,
  six: 0.99,
  seven: 0.99,
  eight: 0.99,
  nine: 0.99,
};
function showPopup(number) {
  const pageText = number === 0 ? 'Home' : `Page ${number}`;
  document.getElementById('popupMessage').textContent = `Do you want
to navigate to ${pageText}?`;
  document.getElementById('customPopup').style.display = 'block';
}

function confirmNavigation(shouldNavigate) {
  document.getElementById('customPopup').style.display = 'none';
  if (shouldNavigate) {
    const page =
      lastRecognizedNumber === 0 ? 'home' : `page${lastRecognizedNumber}`;
    console.log(lastRecognizedNumber);
    console.log('Navigating to ${page}.html');
    window.location.href = `${page}.html`;
  }
}

async function initializeRecognizer() {
  recognizer = await speechCommands.create('BROWSER_FFT');
  await recognizer.ensureModelLoaded();
  console.log(recognizer.wordLabels());
}

const toggleButton = document.getElementById('toggleRecognition');

toggleButton.addEventListener('click', async () => {
  if (!recognizer) {
    await initializeRecognizer();
  }

  toggleButton.disabled = true;

  if (listening) {
    recognizer.stopListening();
    listening = false;
    toggleButton.textContent = 'Start Recognition';
    toggleButton.disabled = false;
  } else {
    try {
      recognizer.listen(
        (result) => {
          const scores = Array.from(result.scores);
          const labels = recognizer.wordLabels();
          const labelsToIgnore = ['go', 'left', 'right', 'up', 'down'];

          // Create an array of label-score pairs
          let labelScorePairs = scores.map((score, index) => ({
            label: labels[index],
            score: score,
          }));

          // Filter out the ignored labels
          labelScorePairs = labelScorePairs.filter(
            (pair) => !labelsToIgnore.includes(pair.label)
          );

          // Sort the pairs by score in descending order
          labelScorePairs.sort((a, b) => b.score - a.score);

          // Process the highest scoring label
          if (labelScorePairs.length > 0) {
            const highestPair = labelScorePairs[0];
            const highestLabel = highestPair.label;
            const highestScore = highestPair.score;

            console.log(`Highest: ${highestLabel}, ${highestScore}`);

            document.getElementById(
              'resultText'
            ).textContent = `Most probable class: ${highestLabel}, Probability: ${highestScore}`;

            // Check if the highest label meets its individual threshold
            if (
              numberWords.includes(highestLabel) &&
              highestScore >= (numberThresholds[highestLabel])
            ) {
              lastRecognizedNumber = numberWords.indexOf(highestLabel);
              showPopup(lastRecognizedNumber);
            } else if (
              highestLabel === 'yes' &&
              lastRecognizedNumber !== null
            ) {
              confirmNavigation(true);
            } else if (highestLabel === 'no') {
              confirmNavigation(false);
              lastRecognizedNumber = null;
            }
          }
        },
        {
          includeSpectrogram: true,
          probabilityThreshold: 0.95, //general threshold
        }
      );
      listening = true;
      toggleButton.textContent = 'Stop Recognition';
    } catch (error) {
      console.error('Error in speech recognition: ', error);
    } finally {
      toggleButton.disabled = false;
    }
  }
});
