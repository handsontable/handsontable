const inquirer = require('inquirer');
const moment = require('moment');
const {
  isVersionValid,
  isReleaseDateValid,
  getVersionFromReleaseType,
  setVersion,
  setReleaseDate,
} = require('./setVersion');

const questions = [
  {
    type: 'list',
    name: 'changeType',
    message: 'Select the type of the release.',
    choices: [
      'Major',
      'Minor',
      'Patch',
      'Custom',
    ],
    filter: value => value.toLowerCase(),
  },
  {
    type: 'input',
    name: 'customVersion',
    message: 'Enter the custom version number.',
    when: answers => answers.changeType === 'custom',
    validate: (value) => {
      if (isVersionValid(value)) {
        return true;
      }

      return 'The provided version is not a proper semver version number.';
    },
  },
  {
    type: 'input',
    name: 'releaseDate',
    message: 'Enter the release date in a form of DD/MM/YYY.',
    validate: (value) => {
      if (isReleaseDateValid(value)) {
        return true;
      }

      return 'The provided date is invalid';
    },
  }
];
const getConfirmationQuestion = (version, formattedDate) => [
  {
    type: 'confirm',
    name: 'isReleaseDateConfirmed',
    message: `

* New version: ${version}
* Release date: ${formattedDate}

Are the version number and release date above correct?`,
    default: true,
  },
];

inquirer.prompt(questions).then((answers) => {
  const promptAnswers = answers;
  const releaseDate = promptAnswers.releaseDate;
  const releaseDateSplit = promptAnswers.releaseDate.split('/');
  const releaseDateObj = moment({
    day: releaseDateSplit[0],
    month: releaseDateSplit[1] - 1,
    year: releaseDateSplit[2],
  });
  const newVersion =
    promptAnswers.changeType !== 'custom' ?
      getVersionFromReleaseType(promptAnswers.changeType) :
      promptAnswers.customVersion;

  inquirer.prompt(
    getConfirmationQuestion(newVersion, releaseDateObj.format('DD MMMM YYYY'))
  ).then((confirmationAnswers) => {
    if (confirmationAnswers.isReleaseDateConfirmed) {
      setVersion(newVersion);
      setReleaseDate(releaseDate);
    }
  });
});
