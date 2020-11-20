const { forEachObjIndexed } = require('ramda');

const getResDataForNotMandatoryParam = (
  madatoryParamList = [],
  missingParamList = []
) => {
  return {
    success: false,
    message: `필수 파라미터 [ ${madatoryParamList.join(" , ")} ] 중  [ ${missingParamList.join(",")} ] 가 누락되었습니다.`
  };
};

const promiseHandler = promise =>
  promise
    .then(data => ({
      data,
      err: null
    }))
    .catch(err => ({
      data: null,
      err
    }));

const decodeError = error =>
  `error.name:${error.name}|error.message:${error.message}`;

const responseError = (errorCode, errorMessage) => ({
  success: false,
  errorCode,
  errorMessage
});

const responseSuccess = rows => ({
  success: true,
  result: rows
});

const isEmpty = value => !value;

const checkMadatoryParameter = (value, key) => {
  if (isEmpty(value)) {
    const notExistMandatoryParameterError = new Error(`${key} 값이 없습니다.`);
    notExistMandatoryParameterError.code = '418';
    throw notExistMandatoryParameterError;
  }
  return false;
}

const checkMandatoryParameters = forEachObjIndexed(checkMadatoryParameter);

const checkSqlInjection = (value) => {
  var result = {
    result: true,
    message: ""
  };
  if (value.search(/\s/)) {
    result.result = false;
    result.message = "Invalid Parameters";
  }
  return result;
}

// filter for Date Arguments : numeric
const filterArgumentsNumber = (args) => {
  return args.replace(/[^0-9]/g, '');
}

const filterArgumentsTimeFormat = (args) => {
  return args.replace(/[^0-9:]/g, '');
}

const filterArgumentsNumericList = (args) => {
  return args.replace(/[^0-9,]/g , '');
}

const filterArgumentsCharacterList = (args) => {
  return args.replace(/[^가-힣a-zA-Z0-9,-_]/g , '');
}

const filterArgumentsIncludeAlphabet = (args) => {
  return args.replace(/[^a-zA-Z0-9:-_]/g , '');
}

const filterArgumentsIncludeKorean = (args) => {
  return args.replace(/[^가-힣a-zA-Z0-9:-_]/g , '');
}

const convertArgument = (args) => {
  return args.replace(/[^가-힣a-zA-Z0-9]/g, '').toLowerCase();
}


module.exports = {
  getResDataForNotMandatoryParam,
  checkSqlInjection,
  filterArgumentsNumber,
  filterArgumentsTimeFormat,
  filterArgumentsNumericList,
  filterArgumentsCharacterList,
  filterArgumentsIncludeAlphabet,
  filterArgumentsIncludeKorean,
  convertArgument,
  promiseHandler,
  decodeError,
  responseError,
  responseSuccess,
  checkMandatoryParameters,
};
